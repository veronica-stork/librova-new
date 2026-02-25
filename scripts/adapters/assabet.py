import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from urllib.parse import urljoin  # <-- Added for URL resolution
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
        
        # Pull the User-Agent from .env.local, fallback to a generic one if missing
        bot_agent = os.getenv('SCRAPER_USER_AGENT', 'LocalLibraryAggregator/1.0 (Contact info hidden)')
        headers = {'User-Agent': bot_agent}
        
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
        and handle year-end rollovers safely.
        """
        start_time = time_str.split('—')[0].strip()
        
        if "AM" not in start_time and "PM" not in start_time:
            period = time_str.split(' ')[-1]
            start_time = f"{start_time} {period}"

        # Handle the New Year Rollover bug
        now = datetime.now()
        current_year = now.year
        
        # Extract the month name from the string (e.g., "Monday, January 5" -> "January")
        month_str = date_str.split(',')[1].strip().split(' ')[0]
        event_month = datetime.strptime(month_str, "%B").month
        
        # If we are in December but looking at a January event, bump the year forward
        if now.month == 12 and event_month == 1:
            current_year += 1

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

        # Note: Depending on Assabet version, class might be listing_event or listing-event
        event_cards = soup.find_all('div', class_=['listing-event', 'listing_event'])

        for card in event_cards:
            event_url = None
            title = "N/A"
            
            # Target specifically the h2 so we get the actual title, not the date/time from the h3
            h2_tag = card.find('h2')
            if h2_tag:
                title = h2_tag.get_text(strip=True)
                a_tag = h2_tag.find('a', href=True)
                if a_tag:
                    # urljoin correctly handles both relative and absolute links
                    event_url = urljoin(self.target_url, a_tag['href'])
            # ... the rest of the extraction logic remains exactly the same ...
            else:
                title = "N/A"

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
                event = StandardizedEvent(
                    title=title,
                    start_time=dt_obj,
                    library_id=self.library_id,
                    description=description,
                    event_url=event_url  # <-- Appending the extracted URL here
                )
                events.append(event)
                
            elif dt_obj > seven_days_later:
                pass 
                
        return events