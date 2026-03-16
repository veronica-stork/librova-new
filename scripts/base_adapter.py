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
                if not event.category_ids:
                    event.category_ids = extract_category_ids(event.title, event.description)
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
        Calculates the most prominent category for an event to aid in UI masking 
        and primary tagging.
        """
        if not category_ids:
            return None
        
        title_lower = title.lower()

        for cat_id in category_ids:
            cat_name = ID_TO_CAT_NAME.get(cat_id)

            if cat_name:
                keywords = event_categories.get(cat_name, [cat_name])
            
                if any(keyword in title_lower for keyword in keywords):
                        return cat_id
            
        # 2. Specificity vs. Breadth
        # Broad tags: 8(Teens), 9(Adults), 10(Family), 11(Children), 12(Early Childhood)
        broad_tags = [8, 9, 10, 11, 12] 
        specific_tags = [cat_id for cat_id in category_ids if cat_id not in broad_tags]
        
        # If there's exactly one specific tag (like Movies, STEM, or Crafts), it wins
        if len(specific_tags) == 1:
            return specific_tags[0]
            
        # 3. Default fallback
        # If it's a mix of specific tags (Teen Time: movies + games), fall back to the first broad tag
        return category_ids[0]
    

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