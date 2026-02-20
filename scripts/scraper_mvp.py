import requests
import os
import json
from bs4 import BeautifulSoup
from datetime import datetime
from dotenv import load_dotenv

load_dotenv('../.env.local')
# Use localhost for local Next.js development, swap to your Vercel domain later
API_URL = "http://localhost:3000/api/events" 
API_KEY = os.getenv("SCRAPER_API_KEY")

TARGET_URL = "https://redhooklibrary.assabetinteractive.com/calendar/"
def send_to_database(title, iso_date, description):
    payload = {
        "library_id": 3,
        "library": "Red Hook Public Library",
        "title": title,
        "description": description,
        "start_time": iso_date
        # end_time, registration_link, etc. will default to null in the API if omitted
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        
        print(f"response: {response}")
        if response.status_code == 201:
            result = response.json()
            if result.get("inserted"):
                print(f"✅ Successfully inserted: {title}")
            else:
                print(f"⚠️ Skipped duplicate: {title}")
        else:
            print(f"❌ Failed to insert {title}: {response.text}")
            
    except Exception as e:
        print(f"Network error while sending {title}: {e}")
        
def clean_and_format_data(date_str, time_str):
    # 1. Clean the Time: Handle the long dash '—' Assabet uses
    # Extract only the start time: "11:15—11:45 AM" -> "11:15 AM"
    start_time = time_str.split('—')[0].strip()
    if "AM" not in start_time and "PM" not in start_time:
        # If the range was "11:15—11:45 AM", the first part lacks the period
        period = time_str.split(' ')[-1] # Get AM or PM
        start_time = f"{start_time} {period}"

    # 2. Add current year since it's missing from the display string
    current_year = datetime.now().year
    full_date_str = f"{date_str} {current_year} {start_time}"
    
    # 3. Parse into a Python datetime object
    # Format: "Thursday, February 5 2026 11:15 AM"
    try:
        dt_obj = datetime.strptime(full_date_str, "%A, %B %d %Y %I:%M %p")
        return dt_obj.isoformat() # Returns 2026-02-05T11:15:00
    except ValueError as e:
        print(f"Date parsing error: {e}")
        return None

def fetch_events_mvp():
    print(f"Scraping and cleaning data from: {TARGET_URL}...\n")
    headers = {'User-Agent': 'Librova-MVP-Scraper/1.0'}
    
    try:
        response = requests.get(TARGET_URL, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        event_cards = soup.find_all('div', class_='listing-event')
        
        for card in event_cards[:5]:
            title = card.find('h2').get_text(strip=True) if card.find('h2') else "N/A"
            date_raw = card.find('span', class_='event-day').get_text(strip=True)
            time_raw = card.find('span', class_='event-time').get_text(strip=True)
            desc_elem = card.find('div', class_='event-description-excerpt')
            
            if desc_elem:
                # Find and remove the "Learn More" link so it doesn't get included in the text
                learn_more_link = desc_elem.find('a', class_='event-description-excerpt-more')
                if learn_more_link:
                    learn_more_link.decompose()
                
                # Extract the clean text (this naturally ignores the image tag)
                description = desc_elem.get_text(strip=True)
            else:
                description = "N/A"
            # THE CLEANING STEP
            iso_timestamp = clean_and_format_data(date_raw, time_raw)
            
            print("-" * 50)
            print(f"Title:     {title}")
            print(f"ISO Date:  {iso_timestamp}") # This is what the DB will love
            print(f"Description: {description}")

            if iso_timestamp: 
                print(f"Sending to API...")
                send_to_database(title, iso_timestamp, description)
            else:
                print("Skipped sending to API due to missing/invalid date.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    fetch_events_mvp()