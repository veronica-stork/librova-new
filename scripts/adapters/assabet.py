import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from urllib.parse import urljoin
from typing import Any, List

from models import StandardizedEvent
from base_adapter import BaseLibraryScraper

class AssabetAdapter(BaseLibraryScraper):
    """
    Adapter for scraping Assabet Interactive library calendars.
    """
    def __init__(self, library_id: int, target_url: str):
        super().__init__(library_id)
        self.target_url = target_url

    def fetch_data(self) -> Any:
        print(f"📡 Fetching Assabet calendar data from: {self.target_url}...")
        
        bot_agent = os.getenv('SCRAPER_USER_AGENT', 'LibrovaScraper/1.0 (Contact: your-email@example.com)')
        headers = {'User-Agent': bot_agent}
        
        try:
            response = requests.get(self.target_url, headers=headers)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch data from {self.target_url}: {e}")
            return None

    def normalize_data(self, soup: Any) -> List[StandardizedEvent]:
        events = []
        if not soup:
            return events

        print("🧹 Normalizing raw HTML into standardized event data...")
        
        now = datetime.now()
        seven_days_later = now + timedelta(days=7)

        # Support both 'listing-event' and 'listing_event' classes
        event_cards = soup.find_all('div', class_=['listing-event', 'listing_event'])

        for card in event_cards:
            title = "N/A"
            event_url = None
            
            h2_tag = card.find('h2')
            if h2_tag:
                title = h2_tag.get_text(strip=True)
                a_tag = h2_tag.find('a', href=True)
                if a_tag:
                    event_url = urljoin(self.target_url, a_tag['href'])

            date_raw = card.find('span', class_='event-day').get_text(strip=True)
            time_raw = card.find('span', class_='event-time').get_text(strip=True)
            desc_elem = card.find('div', class_='event-description-excerpt')
            
            description = ""
            if desc_elem:
                learn_more_link = desc_elem.find('a', class_='event-description-excerpt-more')
                if learn_more_link:
                    learn_more_link.decompose()
                description = desc_elem.get_text(strip=True)
                
            # --- CALLING THE UNIVERSAL DATE ENGINE ---
            dt_obj = self.parse_datetime(date_raw, time_raw)
            
            if not dt_obj:
                print(f"⏭️ Skipped '{title}': Missing/invalid date.")
                continue

            # Rolling 7-day window filter
            if now <= dt_obj <= seven_days_later:
                event = StandardizedEvent(
                    title=title,
                    start_time=dt_obj,
                    library_id=self.library_id,
                    description=description,
                    event_url=event_url
                )
                events.append(event)
                
        return events