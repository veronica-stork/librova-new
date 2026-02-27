import requests
from datetime import datetime, timedelta
from urllib.parse import urljoin
from typing import Any, List

# Importing your contract classes
from models import StandardizedEvent
from base_adapter import BaseLibraryScraper

class LibCalAdapter(BaseLibraryScraper):
    """
    Adapter for scraping Springshare LibCal hidden JSON APIs.
    Inherits from BaseLibraryScraper.
    """
    def __init__(self, library_id: int, config: dict):
        super().__init__(library_id) # Set up the API keys and base variables
        self.base_api_url = config.get('base_api_url')
        self.iid = config.get('iid')
        self.calendar_id = config.get('c')
        self.target_url = self.base_api_url

    def fetch_data(self) -> Any:
        """
        Hits the hidden LibCal JSON endpoint for the next 7 days and returns the raw JSON list.
        """
        print(f"📡 Fetching LibCal JSON for Library ID {self.library_id}...")
        
        # 1. Dynamically calculate the 7-day date range
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

        # 2. Construct the API URL
        api_url = f"{self.base_api_url}/widget/events/calendar/list"
        params = {
            'iid': self.iid,
            'c': self.calendar_id,
            'sp': 1,
            'timezone': 'America/New_York',
            'start': start_date,
            'end': end_date
        }

        try:
            # 3. Hit the endpoint and parse the JSON automatically
            response = requests.get(api_url, params=params)
            response.raise_for_status()
            return response.json() # Returns the raw dictionary/list
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch data from {api_url}: {e}")
            return None

    def normalize_data(self, raw_data: Any) -> List[StandardizedEvent]:
        """
        Loops through the raw LibCal JSON and maps it to StandardizedEvent objects.
        """
        events = []
        if not raw_data:
            return events

        print("🧹 Normalizing LibCal JSON into standardized event data...")

        for event in raw_data:
            title = event.get('title', 'Untitled Event')
            raw_url = event.get('url', '')
            event_url = urljoin(self.base_api_url, raw_url) if raw_url else ''
            
            # Combine LibCal's rich metadata so your heuristic categorizer has a lot to work with!
            description = event.get('short_desc', '')
            audiences = event.get('audiences', '')
            categories = event.get('categories', '')
            
            # We shove this all into the 'description' field of the dataclass 
            # so `extract_category_ids` can read it in the base class.
            classification_text = f"{title} {description} {audiences} {categories}".strip()

            # Parse the ISO date string into a Python datetime object
            start_str = event.get('start')
            try:
                # LibCal uses clean ISO formatting: 2026-02-25T10:00:00
                dt_obj = datetime.fromisoformat(start_str)
            except (ValueError, TypeError):
                print(f"⏭️ Skipped '{title}': Missing/invalid date.")
                continue

            # Create the standardized dataclass
            standardized_event = StandardizedEvent(
                title=title,
                start_time=dt_obj,
                library_id=self.library_id,
                description=classification_text, 
                event_url=event_url
            )
            
            events.append(standardized_event)

        return events