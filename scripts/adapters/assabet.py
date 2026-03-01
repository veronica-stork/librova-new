import os
import requests
import calendar
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
        now = datetime.now()
        # Find exactly how many days are in the current month (handles leap years automatically!)
        days_in_month = calendar.monthrange(now.year, now.month)[1]
        days_left = days_in_month - now.day

        # We always start with the base URL (current month)
        urls_to_scrape = [self.target_url]

        # --- THE 7-DAY BOUNDARY CHECK ---
        if days_left <= 7:
            print(f"🗓️ Month boundary approaching ({days_left} days left). Fetching next month...")
            
            # Calculate next month and year
            next_month = now.month + 1 if now.month < 12 else 1
            next_year = now.year if now.month < 12 else now.year + 1
            
            # 💥 THE FIX: Get the full lowercase name of the month (e.g., 'march')
            month_name = calendar.month_name[next_month].lower()
            
            # Assabet paginates by appending /YYYY-monthname to the base calendar URL
            next_month_url = f"{self.target_url.rstrip('/')}/{next_year}-{month_name}"
            urls_to_scrape.append(next_month_url)

        bot_agent = os.getenv('SCRAPER_USER_AGENT', 'LibrovaScraper/1.0 (Contact: your-email@example.com)')
        headers = {'User-Agent': bot_agent}
        
        combined_html = ""
        
        # Loop through our URL(s) and glue the HTML together
        for url in urls_to_scrape:
            print(f"📡 Fetching Assabet calendar data from: {url}...")
            try:
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                combined_html += response.text
            except requests.exceptions.RequestException as e:
                print(f"❌ Failed to fetch data from {url}: {e}")
                
        if not combined_html:
            return None
            
        return BeautifulSoup(combined_html, 'html.parser')

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