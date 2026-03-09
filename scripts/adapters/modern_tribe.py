import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any
from bs4 import BeautifulSoup

from models import StandardizedEvent 
from base_adapter import BaseLibraryScraper 

class ModernTribeAdapter(BaseLibraryScraper):
    def __init__(self, library_id: int, target_url: str):
        super().__init__(library_id)
        # Clean the URL to ensure no trailing slash
        self.target_url = target_url.rstrip('/')

    def fetch_data(self) -> Dict[str, Any]:
        """
        Hits the built-in WordPress REST API for The Events Calendar,
        specifically requesting only events occurring in the next 7 days.
        """
        # Calculate our 7-day window
        now = datetime.now()
        seven_days_from_now = now + timedelta(days=7)
        
        # Format for the API (YYYY-MM-DD)
        start_date_str = now.strftime("%Y-%m-%d")
        end_date_str = seven_days_from_now.strftime("%Y-%m-%d")
        
        # Build the URL with the date filters
        api_url = f"{self.target_url}/wp-json/tribe/events/v1/events"
        params = {
            "per_page": 50,
            "start_date": start_date_str,
            "end_date": end_date_str
        }
        
        try:
            response = requests.get(
                api_url, 
                params=params,
                headers={'User-Agent': 'Librova Scraper/1.0'},
                timeout=15
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"⚠️ API returned {response.status_code} for {api_url}")
                return {}
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to connect to {api_url}: {e}")
            return {}

    def normalize_data(self, raw_data: Dict[str, Any]) -> List[StandardizedEvent]:
        normalized_events = []
        
        # The JSON payload contains a list of events under the 'events' key
        events_list = raw_data.get('events', [])
        
        for item in events_list:
            try:
                # 1. Clean the Title 
                # (WP sometimes returns HTML entities like &#8211; for dashes)
                raw_title = item.get('title', '')
                decoded_title = BeautifulSoup(raw_title, 'html.parser').get_text()
                title = self.clean_title(decoded_title)
                
                # 2. Extract Timestamps
                # Modern Tribe API returns beautiful strings: "2026-03-07 10:15:00"
                start_str = item.get('start_date')
                end_str = item.get('end_date')
                
                start_dt = None
                if start_str:
                    start_dt = datetime.strptime(start_str, "%Y-%m-%d %H:%M:%S")
                    
                end_dt = None
                if end_str:
                    end_dt = datetime.strptime(end_str, "%Y-%m-%d %H:%M:%S")
                    
                if not start_dt:
                    continue # Skip if there is no valid start time
                    
                # 3. Clean Description
                raw_desc = item.get('description', '')
                description = self.clean_html(raw_desc)
                
                # 4. Extract Native Categories
                # We append the native categories to the description so your 
                # Base Scraper's `extract_category_ids` function can easily pick them up.
                native_categories = []
                for cat in item.get('categories', []):
                    native_categories.append(cat.get('name', ''))
                    
                if native_categories:
                    description += f"\n\nTags: {', '.join(native_categories)}"

                normalized_events.append(StandardizedEvent(
                    title=title,
                    start_time=start_dt,
                    end_time=end_dt,
                    library_id=self.library_id,
                    description=description,
                    event_url=item.get('url')
                ))
                
            except Exception as e:
                print(f"⚠️ Error normalizing Modern Tribe event '{item.get('title')}': {e}")
                
        return normalized_events