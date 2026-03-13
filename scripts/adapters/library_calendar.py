import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Any, List
from urllib.parse import urljoin

from models import StandardizedEvent
from base_adapter import BaseLibraryScraper

class LibraryCalendarAdapter(BaseLibraryScraper):
    """
    Scraper for LibraryCalendar platform.
    """

    CATEGORY_MAP = {
        "Early Childhood (Birth - 2)": 12, 
        "Preschool (3 - 5)": 12,
        "Computers / Internet": 13,
        "Children's Program": 11,
        "Storytime": 1,
        "Health & Wellness": 6,
        "Games": 4,
        "Art": 2,
        "History": 5,
        "Family": 10,
        "Music": 16,
        "Everyone": 10,
        "Youth": 11,
        "Adults": 9,
        "Teen Program": 8,
        "Children (6 - 8)": 11,
        "Teens (12-18)": 8
    }

    def __init__(self, library_id: int, target_url: str):
        super().__init__(library_id)
        # target_url: https://poughkeepsie.librarycalendar.com/events/list
        self.target_url = target_url

    def fetch_data(self) -> Any:
        """Fetches the HTML by looping through pagination."""
        combined_html = ""
        page = 0
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }

        # 2 pages is usually enough for a 7 to 14-day window
        while page < 2: 
            url = f"{self.target_url}?page={page}"
            print(f"📡 Fetching LibraryCalendar page {page}...")
            
            try:
                response = requests.get(url, headers=headers, timeout=15)
                response.raise_for_status()
                combined_html += response.text
                page += 1
            except Exception as e:
                print(f"❌ Error fetching {url}: {e}")
                break
                
        return BeautifulSoup(combined_html, 'html.parser')

    def normalize_data(self, soup: Any) -> List[StandardizedEvent]:
        events = []
        if not soup: return events
        
        # Target the broadest possible container for the event rows
        cards = soup.select('.lc-list-event-content-row')
        print(f"🧹 Found {len(cards)} raw event blocks. Processing...")

        now = datetime.now()
        window_end = now + timedelta(days=14)

        for i, card in enumerate(cards):
            # 1. Grab Title and URL
            title_tag = card.find('h2').find('a') if card.find('h2') else None
            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)
            event_url = urljoin(self.target_url, title_tag['href'])

            # 2. Grab raw Date/Time block
            date_time_elem = card.select_one('.lc-list-event-info-item--date')
            if not date_time_elem:
                continue

            raw_text = date_time_elem.get_text(separator=' ', strip=True)
            
            # 3. ROBUST REGEX SPLIT
            # Looks for the first occurrence of a time format (e.g., 6:00pm, 10:30am, 6pm)
            match = re.search(r'(\d{1,2}:\d{2}\s*[apAP][mM]?|\d{1,2}\s*[apAP][mM])', raw_text)

            if match:
                time_start_index = match.start()
                # Slice the string exactly where the time starts
                date_part = raw_text[:time_start_index].replace(' at', '').strip()
                time_part = raw_text[time_start_index:].strip()
            else:
                date_part = raw_text
                time_part = ""

            # 4. Clean up strings for the Base Engine
            # Strip the year so the Base Scraper can do its job: "Thursday, March 5, 2026" -> "Thursday, March 5"
            clean_date = date_part.split(', 20')[0].strip()
            # Grab just the start time: "6:00pm - 8:00pm" -> "6:00pm"
            # Using regex split to handle both hyphens and en-dashes
            clean_time = re.split(r'[-–]', time_part)[0].strip()

            dt_obj = self.parse_datetime(clean_date, clean_time)

            if not dt_obj:
                print(f"   ⚠️ [{i}] Failed to parse: Date='{clean_date}' | Time='{clean_time}'")
                continue

            # 5. Check Window and Build Event
            if now <= dt_obj <= window_end:
                description = self._fetch_description(event_url)
                category_ids = self._resolve_categories(card)

                event = StandardizedEvent(
                    title=title,
                    start_time=dt_obj,
                    library_id=self.library_id,
                    description=description,
                    event_url=event_url,
                    category_ids=category_ids if category_ids else None
                )
                events.append(event)
                print(f"   ✅ Processed: {title}")

        return events

    def _resolve_categories(self, card) -> List[int]:
        """Hybrid resolver for both link-based and plain-text categories."""
        tags = []
        
        # Look for Link-based tags
        term_links = card.select('.lc-list-event-row-terms a, .lc-event__tags a')
        for link in term_links:
            term = link.get_text(strip=True)
            if term in self.CATEGORY_MAP:
                tags.append(self.CATEGORY_MAP[term])

        # Look for Plain-text labels (Program Type: Non-Library, etc.)
        term_divs = card.select('.lc-list-event-program-type')
        for div in term_divs:
            raw_text = div.get_text(strip=True)
            if ":" in raw_text:
                raw_text = raw_text.split(":", 1)[1].strip()
            
            if raw_text in self.CATEGORY_MAP:
                tags.append(self.CATEGORY_MAP[raw_text])
                
        return list(set(tags))

    def _fetch_description(self, event_url: str) -> str:
        """Deep fetch to grab the full description from the event detail page."""
        try:
            resp = requests.get(event_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            detail_soup = BeautifulSoup(resp.text, 'html.parser')
            desc_container = detail_soup.select_one('.lc-event__description, .field--name-body')
            return desc_container.get_text(separator=' ', strip=True) if desc_container else ""
        except:
            return ""