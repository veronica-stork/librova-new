import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Any, List

# Importing the contract classes from the parent directory
from models import StandardizedEvent
from base_adapter import BaseLibraryScraper

class AssabetAdapter(BaseLibraryScraper):
    """
    Adapter for scraping Assabet Interactive library calendars.
    Inherits from BaseLibraryScraper.
    """

    def fetch_data(self) -> Any:
        """
        Fetches the raw HTML from the Assabet calendar URL and 
        returns a BeautifulSoup object.
        """
        print(f"📡 Fetching Assabet calendar data from: {self.target_url}...")
        headers = {'User-Agent': 'LocalLibraryAggregator/1.0 (veronica.stork@gmail.com)'}
        
        try:
            response = requests.get(self.target_url, headers=headers)
            response.raise_for_status() # Raises an HTTPError for bad responses
            return BeautifulSoup(response.text, 'html.parser')
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch data from {self.target_url}: {e}")
            return None

    def _parse_datetime(self, date_str: str, time_str: str) -> datetime:
        """
        Private helper method to clean Assabet's specific time format 
        (e.g., handling the '—' and missing AM/PM) into a valid datetime object.
        """
        start_time = time_str.split('—')[0].strip()
        
        if "AM" not in start_time and "PM" not in start_time:
            period = time_str.split(' ')[-1]
            start_time = f"{start_time} {period}"

        current_year = datetime.now().year
        full_date_str = f"{date_str} {current_year} {start_time}"
        
        try:
            return datetime.strptime(full_date_str, "%A, %B %d %Y %I:%M %p")
        except ValueError as e:
            print(f"⚠️ Date parsing error for '{full_date_str}': {e}")
            return None

    def normalize_data(self, soup: Any) -> List[StandardizedEvent]:
        """
        Parses the BeautifulSoup object, extracts the 7-day window of events, 
        and maps them to the StandardizedEvent dataclass.
        """
        events = []
        if not soup:
            return events

        print("🧹 Normalizing raw HTML into standardized event data...")
        
        now = datetime.now()
        seven_days_later = now + timedelta(days=7)

        event_cards = soup.find_all('div', class_='listing-event')

        for card in event_cards:
            title = card.find('h2').get_text(strip=True) if card.find('h2') else "N/A"
            date_raw = card.find('span', class_='event-day').get_text(strip=True)
            time_raw = card.find('span', class_='event-time').get_text(strip=True)
            desc_elem = card.find('div', class_='event-description-excerpt')
            
            if desc_elem:
                learn_more_link = desc_elem.find('a', class_='event-description-excerpt-more')
                if learn_more_link:
                    learn_more_link.decompose()
                description = desc_elem.get_text(strip=True)
            else:
                description = ""
                
            # Get datetime object 
            dt_obj = self._parse_datetime(date_raw, time_raw)
            
            if not dt_obj:
                print(f"⏭️ Skipped '{title}': Missing/invalid date.")
                continue

            # Evaluate if the event falls within the rolling 7-day window
            if now <= dt_obj <= seven_days_later:
                # Map to our strict dataclass structure
                event = StandardizedEvent(
                    title=title,
                    start_time=dt_obj,
                    library_id=self.library_id,
                    description=description
                )
                events.append(event)
                
            elif dt_obj > seven_days_later:
                # If we hit an event more than 7 days out, we ignore it.
                pass 
                
        return events