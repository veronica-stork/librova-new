import requests
import os
import json
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv('../.env.local')

# API Endpoints
API_URL = "http://localhost:3000/api/events" 
CLEANUP_URL = "http://localhost:3000/api/events/cleanup" # New endpoint for pruning
API_KEY = os.getenv("SCRAPER_API_KEY")

TARGET_URL = "https://redhooklibrary.assabetinteractive.com/calendar/"

def prune_past_events():
    """Triggers the Next.js API to run the cleanup SQL command."""
    print("🧹 Running database cleanup for past events...")
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.delete(CLEANUP_URL, headers=headers)
        if response.status_code in [200, 204]:
            print("✅ Successfully pruned past events from the database.\n")
        else:
            print(f"❌ Failed to prune events: {response.status_code} - {response.text}\n")
    except Exception as e:
        print(f"Network error during cleanup: {e}\n")

def send_to_database(title, iso_date, description):
    payload = {
        "library_id": 3,
        "library": "Red Hook Public Library",
        "title": title,
        "description": description,
        "start_time": iso_date
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        
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
    start_time = time_str.split('—')[0].strip()
    if "AM" not in start_time and "PM" not in start_time:
        period = time_str.split(' ')[-1]
        start_time = f"{start_time} {period}"

    # 2. Add current year
    current_year = datetime.now().year
    full_date_str = f"{date_str} {current_year} {start_time}"
    
    # 3. Parse and return the datetime object
    try:
        dt_obj = datetime.strptime(full_date_str, "%A, %B %d %Y %I:%M %p")
        return dt_obj
    except ValueError as e:
        print(f"Date parsing error: {e}")
        return None

def fetch_events_mvp():
    print(f"Scraping and cleaning data from: {TARGET_URL}...\n")
    headers = {'User-Agent': 'Librova-MVP-Scraper/1.0'}
    
    # Establish our time window
    now = datetime.now()
    seven_days_later = now + timedelta(days=7)
    
    try:
        response = requests.get(TARGET_URL, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        event_cards = soup.find_all('div', class_='listing-event')
        
        # Removed the [:5] slice to process all events
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
                description = "N/A"
                
            # Get datetime object to compare against our 7-day window
            dt_obj = clean_and_format_data(date_raw, time_raw)
            
            if not dt_obj:
                print(f"⏭️ Skipped '{title}': Missing/invalid date.")
                continue

            # Evaluate if the event falls within the rolling 7-day window
            if now <= dt_obj <= seven_days_later:
                iso_timestamp = dt_obj.isoformat()
                print("-" * 50)
                print(f"Title:     {title}")
                print(f"ISO Date:  {iso_timestamp}") 
                print("Sending to API...")
                send_to_database(title, iso_timestamp, description)
                
            elif dt_obj > seven_days_later:
                # If we hit an event more than 7 days out, we can safely ignore it.
                # If you know the calendar is strictly chronological, you could use 'break' here to stop processing entirely.
                pass 
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    prune_past_events() # Clean out old events first
    fetch_events_mvp()  # Then fetch the new ones