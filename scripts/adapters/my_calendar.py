import re
import requests
from bs4 import BeautifulSoup
from typing import List, Any

from models import StandardizedEvent 
from base_adapter import BaseLibraryScraper 

class MyCalendarAdapter(BaseLibraryScraper):
    def __init__(self, library_id: int, target_url: str):
        super().__init__(library_id)
        self.target_url = target_url
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Librova Data Pipeline'
        }

    def fetch_data(self) -> Any:
        """Fetches the main calendar HTML."""
        try:
            response = requests.get(self.target_url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except requests.RequestException as e:
            print(f"❌ HTTP Error fetching My Calendar for library {self.library_id}: {e}")
            return None

    def fetch_event_description(self, event_url: str) -> str:
        """Fetches the individual event page to extract the full description and flyer text."""
        try:
            resp = requests.get(event_url, headers=self.headers, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # "My Calendar" single events usually wrap details in one of these standard containers
            desc_container = soup.find('div', class_='mc-description') or \
                             soup.find('div', class_='mc-main') or \
                             soup.find('div', class_='entry-content')
            
            if desc_container:
                return self.clean_html(str(desc_container))
            return ""
        except Exception as e:
            print(f"⚠️ Failed to fetch description for {event_url}: {e}")
            return ""

    def normalize_data(self, soup: BeautifulSoup) -> List[StandardizedEvent]:
        events = []
        if not soup:
            return events

        # Find all event articles in the calendar grid/list
        article_nodes = soup.find_all('article', class_=re.compile(r'calendar-event'))
        
        for article in article_nodes:
            try:
                # Look for the title tag as usual
                title_tag = article.find(['h4', 'h3'], class_=re.compile(r'mc-title|event-title'))
                if not title_tag:
                    continue

                # 🎯 Narrow Selector: Check if there's a div inside a button (specific to MyCalendar)
                # This avoids pulling in the <title> tag inside the <svg>
                inner_div = title_tag.select_one("button div")
                if inner_div:
                    raw_title = inner_div.get_text(strip=True)
                else:
                    raw_title = title_tag.get_text(strip=True)

                # We send it to clean_title (which we will move to the Base Adapter)
                title = self.clean_title(raw_title)
                
                # --- 2. Start Time ---
                # Rely on the ISO string embedded in the <time> tag
                time_tag = article.find('time', class_='value-title')
                start_time = None
                
                if time_tag and time_tag.has_attr('datetime'):
                    iso_string = time_tag['datetime']
                    try:
                        # Parse the ISO 8601 string directly to preserve the exact time
                        from datetime import datetime
                        start_time = datetime.fromisoformat(iso_string)
                    except ValueError:
                        start_time = None

                # --- 3. Event URL ---
                event_url = None
                read_more_tag = article.find('a', string=re.compile(r'Read more', re.IGNORECASE))
                if read_more_tag and read_more_tag.has_attr('href'):
                    event_url = read_more_tag['href']

                # --- 4. Description ---
                description = ""
                if event_url:
                    # Fetch the actual detail page so we don't just get a blank popup
                    description = self.fetch_event_description(event_url)
                else:
                    # Fallback to the popup's short description if no link exists
                    short_desc_tag = article.find('div', class_='mc-description')
                    if short_desc_tag:
                        description = self.clean_html(str(short_desc_tag))

                # --- 5. Build Event ---
                event = StandardizedEvent(
                    title=title,
                    start_time=start_time,
                    library_id=self.library_id,
                    description=description,
                    event_url=event_url
                )
                events.append(event)
                
            except Exception as e:
                print(f"⚠️ Error normalizing a My Calendar event: {e}")
                
        return events