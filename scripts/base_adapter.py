import re
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Optional, List, Any
from utils.categorization import extract_category_ids, event_categories, CATEGORY_ID_MAP
from utils.filtering import is_public_event

ID_TO_CAT_NAME = {v: k for k, v in CATEGORY_ID_MAP.items()}


class BaseLibraryScraper:

    def __init__(self, library_id: int):
        self.library_id = library_id

    def run(self) -> List[Any]:
        """
        The standard execution flow for ALL adapters.
        1. Fetch raw data
        2. Normalize into StandardizedEvents
        3. Filter out private/cancelled events (the Bouncer)
        4. Inject category tags
        """
        raw_data = self.fetch_data()
        if not raw_data:
            print(f"⚠️ No data fetched for library {self.library_id}")
            return []
        
        all_events = self.normalize_data(raw_data)

        public_events = []

        for event in all_events:
            if is_public_event(event.title, event.description):
                
                metadata = getattr(event, 'raw_metadata', '')
                text_payload = f"{event.description} {metadata}".strip()
                
                if not event.category_ids:
                    event.category_ids = extract_category_ids(event.title, text_payload)
                event.primary_category_id = self.determine_primary_category(event.category_ids, event.title)
                
                public_events.append(event)
            else:
                print(f"🚫 Blocked: {event.title}")
        print(f"✅ Successfully processed and tagged {len(public_events)} events for library {self.library_id}")
        return public_events

    def clean_title(self, title: str) -> str:
        """
        Universal title cleaner to remove time prefixes and redundant whitespace.
        Handles formatting junk like: "Category: General2:00 pm: Award-Worthy Film Series"
        or manually typed titles like "10:30am - Storytime".
        """
        if not title:
            return ""

        # 1. Strip "Category: X" prefixes (specific to MyCalendar and similar plugins)
        # We look for 'Category:' followed by text up until it hits a digit (the time)
        title = re.sub(r'^Category:\s*.*?(?=\d)', '', title, flags=re.IGNORECASE)

        # 2. Strip Time Prefixes (e.g., "2:00 pm:", "10:30am -")
        # Matches: start of string, 1-2 digits, colon, 2 digits, optional space, am/pm, optional separator
        time_prefix_pattern = r'^\d{1,2}:\d{2}\s*[ap]m\s*[:\-]?\s*'
        title = re.sub(time_prefix_pattern, '', title, flags=re.IGNORECASE)

        # 3. Final cleanup of any stray characters left at the start and redundant spaces
        title = title.lstrip(":- ").strip()
        
        return title

    def clean_html(self, raw_html: str) -> str:
        """
        Strips HTML tags from descriptions while preserving natural line breaks 
        for paragraphs and lists.
        """
        if not raw_html:
            return ""
            
        soup = BeautifulSoup(raw_html, 'html.parser')
        
        # 1. Convert structural tags to a temporary text placeholder
        for tag in soup.find_all(['br', 'p', 'li', 'div']):
            tag.insert_after('__LINE_BREAK__')
            
        # 2. Extract the raw text (this strips surrounding spaces but ignores our placeholder)
        text = soup.get_text(strip=True)
        
        # 3. Swap the placeholder back to actual newlines
        text = text.replace('__LINE_BREAK__', '\n')
        
        # 4. Clean up messy whitespace (reduce 3+ newlines to just 2)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()
    
    def determine_primary_category(self, category_ids: List[int], title: str) -> Optional[int]:
        """
        Determines primary category. Movie (21) only wins if 'movie/film/matinee' 
        is explicitly in the title.
        """
        if not category_ids:
            return None
        
        title_lower = title.lower()
        MOVIE_ID = 21
        movie_keywords = ['movie', 'film', 'matinee', 'screening', 'cinema']
        
        # 1. THE MOVIE GATEKEEPER
        # Does the title actually signify this is a "Movie Event"?
        has_movie_keyword = any(k in title_lower for k in movie_keywords)
        
        if MOVIE_ID in category_ids and has_movie_keyword:
            return MOVIE_ID

        # 2. DISQUALIFY MOVIE FROM FALLBACK
        # If the title doesn't say "Movie", we treat the Movie tag as 
        # secondary (like in the "Teen Time" example).
        eligible_ids = [cid for cid in category_ids if cid != MOVIE_ID]
        if not eligible_ids:
            # If Movie was the only tag but wasn't in the title, 
            # we have no choice but to return it or None.
            return MOVIE_ID if has_movie_keyword else None

        # 3. AUDIENCE HIERARCHY
        restrictive_audiences = [8, 9, 12] # Teens, Adults, Early Childhood
        broad_audiences = [10, 11]         # Family, Children
        
        # Check for restrictive audience keywords in title ("Teen Time", "Adult Book Club")
        for aud_id in restrictive_audiences:
            if aud_id in eligible_ids:
                cat_name = ID_TO_CAT_NAME.get(aud_id, "").lower()
                if cat_name in title_lower:
                    return aud_id

        # 4. SPECIFIC ACTIVITY FALLBACK
        # If no restrictive audience is in the title, specific activities 
        # (STEM, Crafts) take precedence over broad audience tags (Family).
        all_audiences = restrictive_audiences + broad_audiences
        specific_activities = [cid for cid in eligible_ids if cid not in all_audiences]
        
        if specific_activities:
            return specific_activities[0]

        # 5. ULTIMATE FALLBACK
        return eligible_ids[0]
    

    def parse_datetime(self, date_val: str, time_val: Optional[str] = None, is_all_day: bool = False) -> Optional[datetime]:
        if not date_val:
            return None

        # --- 1. ISO / LibCal Logic ---
        if "T" in str(date_val) or is_all_day:
            try:
                clean_date = str(date_val).split('T')[0]
                return datetime.fromisoformat(f"{clean_date}T00:00:00")
            except ValueError:
                pass

        # --- 2. String-Based Logic ---
        if time_val:
            time_clean_upper = time_val.upper().replace('.', '').strip()
            
            if "CLOSED" in time_clean_upper:
                return None

            if "ALL DAY" in time_clean_upper:
                try:
                    now = datetime.now()
                    year = now.year
                    month_part = date_val.split(',')[1].strip().split(' ')[0].replace('.', '')
                    event_month = datetime.strptime(month_part[:3], "%b").month
                    if now.month == 12 and event_month == 1: year += 1
                    
                    clean_date_val = date_val.replace('.', '')
                    date_only_str = f"{clean_date_val} {year}"
                    for fmt in ["%A, %B %d %Y", "%a, %b %d %Y", "%A, %b %d %Y", "%a, %B %d %Y"]:
                        try: return datetime.strptime(date_only_str, fmt)
                        except ValueError: continue
                    return None
                except Exception: return None

            try:
                # 1. Split range and strip junk
                start_time = re.split(r'[-–—\(]', time_val)[0].strip().replace('.', '')
                start_time_upper = start_time.upper()

                # 2. Smart Period Inference
                if "AM" not in start_time_upper and "PM" not in start_time_upper:
                    # If the WHOLE string has a PM, and it's not a morning hour (8-11), it's PM
                    try:
                        hour_match = re.search(r'(\d+)', start_time)
                        if hour_match:
                            hour = int(hour_match.group(1))
                            if 8 <= hour <= 11:
                                start_time = f"{start_time} AM"
                            elif "PM" in time_clean_upper:
                                start_time = f"{start_time} PM"
                            else:
                                # Default to PM for 12, 1, 2, 3, 4, 5, 6, 7
                                start_time = f"{start_time} PM"
                    except Exception:
                        start_time = f"{start_time} AM"

                # 3. Final Normalization
                start_time = re.sub(r'(?i)\s*(am|pm)', r' \1', start_time).strip().upper()
                if ':' not in start_time:
                    start_time = start_time.replace(' AM', ':00 AM').replace(' PM', ':00 PM')

                # 4. Year & Construction
                now = datetime.now()
                year = now.year
                month_part = date_val.split(',')[1].strip().split(' ')[0].replace('.', '')
                event_month = datetime.strptime(month_part[:3], "%b").month
                if now.month == 12 and event_month == 1: year += 1

                clean_date_val = date_val.replace('.', '')
                full_date_str = f"{clean_date_val} {year} {start_time}"

                for fmt in ["%A, %B %d %Y %I:%M %p", "%a, %b %d %Y %I:%M %p", "%A, %b %d %Y %I:%M %p", "%a, %B %d %Y %I:%M %p"]:
                    try: return datetime.strptime(full_date_str, fmt)
                    except ValueError: continue
                
                print(f"⚠️ Failed to parse final string: {full_date_str}")
                return None

            except Exception as e:
                print(f"⚠️ Parse Error: {e}")
                return None
                
        return None