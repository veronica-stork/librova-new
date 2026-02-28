from datetime import datetime
from typing import Optional, List, Any
from utils.categorization import extract_category_ids
from utils.filtering import is_public_event

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
        standardized_events = self.normalize_data(raw_data)

        for event in standardized_events:
            if not is_public_event(event.title, event.description):
                # If it returns False, we just skip to the next event
                print(f"🚫 Blocked: {event.title}") # Optional: uncomment to see it working!
                continue
            
            # Auto-tag every event right before it leaves the factory
            event.category_ids = extract_category_ids(event.title, event.description)

        print(f"✅ Successfully processed and tagged {len(standardized_events)} events for library {self.library_id}")
        return standardized_events

    def parse_datetime(self, date_val: str, time_val: Optional[str] = None, is_all_day: bool = False) -> Optional[datetime]:

        """

        Polymorphic date parser for Librova.

        Handles ISO strings (LibCal) and human-readable HTML strings (Assabet).

        """

        if not date_val:

            return None



        # --- 1. ISO / LibCal Logic ---

        if "T" in str(date_val) or is_all_day:

            try:

                clean_date = str(date_val).split('T')[0]

                return datetime.fromisoformat(f"{clean_date}T00:00:00")

            except ValueError:

                pass



        # --- 2. String-Based / Assabet Logic ---

        if time_val:

            time_clean = time_val.lower().strip()

           

            # ⛔ Skip actual closures

            if "closed" in time_clean:

                return None



            # ✅ Catch "All Day" events

            if "all day" in time_clean:

                try:

                    now = datetime.now()

                    year = now.year

                    month_part = date_val.split(',')[1].strip().split(' ')[0]

                    event_month = datetime.strptime(month_part[:3], "%b").month

                   

                    if now.month == 12 and event_month == 1:

                        year += 1

                   

                    date_only_str = f"{date_val} {year}"

                    fmt = "%A, %B %d %Y" if len(month_part) > 3 else "%a, %b %d %Y"

                    return datetime.strptime(date_only_str, fmt)

                except Exception:

                    return None



            # 🕒 Standard time parsing logic

            try:

                # 1. Split the range safely (handles both '—' and '-')

                if '—' in time_val:

                    start_time = time_val.split('—')[0].strip()

                elif '-' in time_val:

                    start_time = time_val.split('-')[0].strip()

                else:

                    start_time = time_val.strip()



                # 2. Smart Period Inference (The Red Hook "Math Help" Fix)

                start_time_upper = start_time.upper()

                if "AM" not in start_time_upper and "PM" not in start_time_upper:

                    if "PM" in time_val.upper():

                        start_time = f"{start_time} PM"

                    elif "AM" in time_val.upper():

                        start_time = f"{start_time} AM"



                # 3. Handle Year Rollover

                now = datetime.now()

                year = now.year

                month_part = date_val.split(',')[1].strip().split(' ')[0]

                event_month = datetime.strptime(month_part[:3], "%b").month

               

                if now.month == 12 and event_month == 1:

                    year += 1



                # 4. Construct and Parse

                full_date_str = f"{date_val} {year} {start_time}"

                fmt = "%A, %B %d %Y %I:%M %p" if len(month_part) > 3 else "%a, %b %d %Y %I:%M %p"

                return datetime.strptime(full_date_str, fmt)

           

            except (ValueError, IndexError, AttributeError) as e:

                print(f"⚠️ Polymorphic Parse Error for '{date_val}' / '{time_val}': {e}")

                return None



        return None