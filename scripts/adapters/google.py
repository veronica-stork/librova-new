import os
import requests
from datetime import datetime, timedelta
from typing import Any, List

from base_adapter import BaseLibraryScraper
from models import StandardizedEvent

class GoogleCalendarAdapter(BaseLibraryScraper):
    """
    Adapter for fetching events via the Google Calendar API.
    """
    def __init__(self, library_id: int, calendar_id: str):
        super().__init__(library_id)
        self.calendar_id = calendar_id
        self.api_key = os.getenv("GOOGLE_API_KEY")

    def fetch_data(self) -> Any:
        if not self.api_key:
            print("❌ Error: GOOGLE_API_KEY not found in environment.")
            return []

        # 1. Define the 7-day rolling window
        now = datetime.utcnow()
        time_min = now.isoformat() + 'Z'
        time_max = (now + timedelta(days=7)).isoformat() + 'Z'
        
        # 2. Build the API URL
        # singleEvents=true expands recurring events so we get individual instances
        # orderBy=startTime ensures they come back chronologically
        url = (
            f"https://www.googleapis.com/calendar/v3/calendars/{self.calendar_id}/events"
            f"?key={self.api_key}"
            f"&timeMin={time_min}"
            f"&timeMax={time_max}"
            f"&singleEvents=true" 
            f"&orderBy=startTime"
        )
        
        print(f"📡 Fetching GCal data for {self.calendar_id}...")
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json().get('items', [])
        except requests.exceptions.RequestException as e:
            print(f"❌ GCal API Error for {self.calendar_id}: {e}")
            return []

    def normalize_data(self, items: Any) -> List[StandardizedEvent]:
        from datetime import datetime # Make sure this is imported at the top!
        events = []
        if not items:
            return events

        print("🧹 Normalizing Google Calendar API data...")

        for item in items:
            # Skip if it's a cancelled event or a ghost entry
            if item.get('status') == 'cancelled':
                continue

            title = item.get('summary', 'No Title')
            description = item.get('description', '')
            clean_desc = self.clean_html(description)
            
            # Extract time information
            start_info = item.get('start', {})
            dt_obj = None
            
            if 'dateTime' in start_info:
                # Specific time event (e.g., '2026-03-02T10:30:00-05:00')
                # Python 3.7+ parses ISO-8601 natively
                dt_obj = datetime.fromisoformat(start_info['dateTime'])
            elif 'date' in start_info:
                # True All-Day event (e.g., '2026-03-02')
                dt_obj = datetime.strptime(start_info['date'], "%Y-%m-%d")

            if dt_obj:
                events.append(StandardizedEvent(
                    title=title,
                    description=clean_desc,
                    start_time=dt_obj,
                    library_id=self.library_id,
                    event_url=item.get('htmlLink', '')
                ))
                
        return events