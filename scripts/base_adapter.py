import os
import requests
from abc import ABC, abstractmethod
from typing import Any, List
from models import StandardizedEvent
from utils.categorization import extract_category_ids
from utils.filtering import is_public_event

class BaseLibraryScraper(ABC):
    def __init__(self, library_id: int):
        self.library_id = library_id
        self.api_key = os.getenv("SCRAPER_API_KEY")
        self.api_url = os.getenv("API_URL", "http://localhost:3000/api/events")

    @abstractmethod
    def fetch_data(self) -> Any:
        """
        Fetch raw data from the library's calendar (HTML, JSON, XML, etc.).
        Must be implemented by subclasses.
        """
        pass

    @abstractmethod
    def normalize_data(self, raw_data: Any) -> List[StandardizedEvent]:
        """
        Parse and clean raw data into a list of StandardizedEvent objects.
        Must be implemented by subclasses.
        """
        pass

    def send_to_database(self, event: StandardizedEvent) -> None:
        """
        Standardized method to POST an event to the Next.js API.
        Inherited by all child scrapers.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(self.api_url, json=event.to_dict(), headers=headers, timeout=10)
            
            if response.status_code == 201:
                result = response.json()
                if result.get("inserted"):
                    print(f"✅ Successfully inserted: {event.title}")
                else:
                    print(f"⚠️ Skipped duplicate: {event.title}")
            else:
                print(f"❌ Failed to insert {event.title}: Status {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Network error while sending {event.title}: {e}")

    def run(self) -> None:
        """
        The main execution pipeline. Orchestrates the fetching, normalizing, 
        and database insertion process. 
        """
        print(f"🚀 Starting scraper for Library ID: {self.library_id} at {self.target_url}")
        
        # 1. Fetch
        raw_data = self.fetch_data()
        if not raw_data:
            print("No data fetched. Exiting.")
            return

        # 2. Normalize
        events = self.normalize_data(raw_data)
        if not events:
            print("No valid events parsed within the timeframe. Exiting.")
            return

        # 3. Augment & Load
        print(f"Found {len(events)} events. Sending to database...")
        for event in events:

            if not is_public_event(event.title, event.description):
                print(f"🛑 Filtered private booking: {event.title}")
                continue
            matched_categories = extract_category_ids(event.title, event.description)
            event.category_ids = matched_categories

            self.send_to_database(event)
            
        print("🏁 Scraping completed.\n")