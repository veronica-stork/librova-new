import os
import requests
import re
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Any, List
from urllib.parse import urljoin

from models import StandardizedEvent
from base_adapter import BaseLibraryScraper

class EngagedPatronsAdapter(BaseLibraryScraper):
    """
    Adapter for scraping legacy ColdFusion Engaged Patrons calendars.
    """
    def __init__(self, library_id: int, site_id: str):
        super().__init__(library_id)
        self.site_id = site_id
        self.base_url = "https://engagedpatrons.org/Events.cfm"

    def fetch_data(self) -> Any:
        start_row = 1
        has_more = True
        max_pages = 5  # Safety ceiling: 5 pages * 20 events = 100 events
        pages_fetched = 0
        
        combined_html = ""
        
        bot_agent = os.getenv('SCRAPER_USER_AGENT', 'LibrovaScraper/1.0')
        headers = {'User-Agent': bot_agent}

        # 1. Use a Session to maintain cookies and state across pagination
        session = requests.Session()
        current_soup = None
        next_btn_name = "Submit"
        next_btn_value = "next 20 listings"

        while has_more and pages_fetched < max_pages:
            print(f"📡 Fetching Engaged Patrons (Site {self.site_id}) - Page {pages_fetched + 1}...")
            
            try:
                if pages_fetched == 0:
                    # Page 1: Standard GET request is the safest way to start
                    url = f"{self.base_url}?SiteID={self.site_id}"
                    response = session.get(url, headers=headers)
                else:
                    # Page 2+: POST the form exactly as the browser would
                    payload = {}
                    
                    # Extract any hidden fields from the previous page's form
                    if current_soup:
                        form = current_soup.find('form')
                        if form:
                            for hidden in form.find_all('input', type='hidden'):
                                if hidden.get('name'):
                                    payload[hidden.get('name')] = hidden.get('value', '')
                    
                    # Inject our core pagination parameters
                    payload['SiteID'] = self.site_id
                    payload['StartRow'] = start_row
                    
                    # CRITICAL: ColdFusion requires the exact button name/value to trigger the action
                    payload[next_btn_name] = next_btn_value

                    response = session.post(self.base_url, data=payload, headers=headers)

                response.raise_for_status()
                combined_html += response.text
                
                # Parse the current response to find the NEXT button
                current_soup = BeautifulSoup(response.text, 'html.parser')
                next_button = current_soup.find('input', {'value': re.compile(r'next 20 listings', re.IGNORECASE)})
                
                if next_button:
                    # Save the exact name and value of the button for the next POST request
                    next_btn_name = next_button.get('name', 'Submit')
                    next_btn_value = next_button.get('value', 'next 20 listings')
                    
                    start_row += 20
                    pages_fetched += 1
                else:
                    has_more = False
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Failed to fetch Engaged Patrons data at row {start_row}: {e}")
                break

        if not combined_html:
            return None
            
        return BeautifulSoup(combined_html, 'html.parser')

    def normalize_data(self, soup: Any) -> List[StandardizedEvent]:
        events = []
        if not soup:
            return events

        print("🧹 Normalizing Engaged Patrons HTML into standardized event data...")
        
        now = datetime.now()
        seven_days_later = now + timedelta(days=7)

        event_wrappers = soup.find_all('div', class_='LEEventWrapper')

        for wrapper in event_wrappers:
            # 1. Extract and check title for immediate spam rejection
            title_node = wrapper.find('div', class_='LETitle')
            title = title_node.get_text(strip=True) if title_node else "Untitled Event"
            
            # Catch operational hours before we waste cycles parsing dates
            # MOVE THIS LOGIC TO THE BOUNCER
            if "LIBRARY OPEN" in title.upper() or "CLOSED" in title.upper():
                continue

            # 2. Extract Date/Time string
            # Format: "Thursday, Mar. 26, 10:30am"
            date_node = wrapper.find('div', class_='LEDate LEAgeRange')
            raw_datetime_str = date_node.get_text(strip=True) if date_node else ""
            
            if not raw_datetime_str:
                continue

            # 3. Split the string for the Base Parser
            # rsplit(',', 1) splits ONLY at the last comma.
            # "Thursday, Mar. 26, 10:30am" -> ["Thursday, Mar. 26", " 10:30am"]
            if raw_datetime_str.count(',') >= 2:
                parts = raw_datetime_str.rsplit(',', 1)
                date_val = parts[0].strip()
                time_val = parts[1].strip()
            else:
                # No time provided. Pass the whole string as the date.
                date_val = raw_datetime_str.strip()
                time_val = "All Day"

            # --- CALLING THE UNIVERSAL DATE ENGINE ---
            dt_obj = self.parse_datetime(date_val, time_val)
            
            if not dt_obj:
                print(f"⏭️ Skipped '{title}': Missing/invalid date.")
                continue

            # 4. Strict 7-Day Window Filter
            if now <= dt_obj <= seven_days_later:
                
                # Extract description
                desc_node = wrapper.find('div', class_='LEDescription')
                description = desc_node.get_text(strip=True) if desc_node else ""

                # Extract event URL
                event_url = None
                base_domain = "https://engagedpatrons.org/"

                graphic_div = wrapper.find('div', class_='LEGraphicDiv')
                if graphic_div:
                    a_tag = graphic_div.find('a', href=True)
                    if a_tag:
                        # Ensure it's a fully qualified URL
                        event_url = urljoin(base_domain, a_tag['href'])
                else:
                    a_tag = title_node.find('a', href=True)
                    if a_tag:
                        event_url = urljoin(base_domain, a_tag['href'])
                
                event = StandardizedEvent(
                    title=title,
                    start_time=dt_obj,
                    library_id=self.library_id,
                    description=description,
                    event_url=event_url 
                )
                events.append(event)
                
        return events