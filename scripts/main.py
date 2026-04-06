import os
import psycopg2
import requests 
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from pathlib import Path

from utils.db_cleanup import prune_past_events

# Adapters 
from adapters.assabet import AssabetAdapter
from adapters.libcal import LibCalAdapter 
from adapters.engaged_patrons import EngagedPatronsAdapter 
from adapters.google import GoogleCalendarAdapter
from adapters.library_calendar import LibraryCalendarAdapter
from adapters.my_calendar import MyCalendarAdapter
from adapters.modern_tribe import ModernTribeAdapter

def fetch_libraries_from_db():
    """Fetches all library records and their configurations from the PostgreSQL database."""
    conn_string = os.getenv('DATABASE_URL')
    libraries = []
    
    try:
        # psycopg2 automatically converts the JSONB column into a Python dictionary
        with psycopg2.connect(conn_string, cursor_factory=RealDictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, scraper_config FROM libraries;")
                libraries = cur.fetchall()
    except Exception as e:
        print(f"❌ Database Error: Could not fetch libraries. {e}")
    
    return libraries

def main():
    print("🤖 Starting Librova Scraper Orchestrator...\n")
    
    # Check what the OS sees before load_dotenv
    print(f"DEBUG: API_BASE_URL from System: {os.getenv('API_BASE_URL')}")
    
    # 1. Load environment variables
    script_dir = Path(__file__).resolve().parent
    env_path = script_dir.parent / '.env.local'

    # 2. Load the file
    load_dotenv(dotenv_path=env_path)

    
        # Check again after load_dotenv
    print(f"DEBUG: API_BASE_URL after load_dotenv: {os.getenv('API_BASE_URL')}")
    
    # 3. Verify it worked before doing anything else
    if not os.getenv("DATABASE_URL"):
        print("❌ CRITICAL ERROR: .env.local failed to load. Are you sure it's in the root folder?")
        return
    
    # 2. Prune old events from the database
    prune_past_events()

    # 3. Fetch the live library list from Neon
    libraries = fetch_libraries_from_db()

    if not libraries:
        print("⚠️ No libraries found in database. Exiting.")
        return

    # Setup API configuration
    API_URL = os.getenv('API_BASE_URL', 'http://localhost:3000') + '/api/events'    

    API_KEY = os.getenv('SCRAPER_API_KEY')

    HEADERS = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # 4. Route and run the appropriate adapters
    for lib in libraries:
        lib_name = lib['name']
        lib_id = lib['id']
        
        # Default to an empty dictionary if scraper_config is completely null
        config = lib.get('scraper_config') or {} 
        platform = config.get('platform')

        print(f"\n{'='*50}")
        print(f"📅 Processing: {lib_name}")
        print(f"Platform: {platform or 'None'} | ID: {lib_id}")
        print(f"{'='*50}")
        
        # Guard clause for missing configuration
        if not platform:
            print(f"⏭️ Skipping {lib_name}: No platform defined in scraper_config.")
            continue
        
        scraper = None

        # --- THE ADAPTER ROUTER ---
        try:
            if platform == "assabet":
                # Pull Assabet-specific variables from the config dict
                scraper = AssabetAdapter(
                    library_id=lib_id, 
                    target_url=config.get('base_url')
                )
                
            elif platform == "libcal":
                scraper = LibCalAdapter(
                    library_id=lib_id, 
                    config=config
                )

            elif platform == 'engaged_patrons':
                scraper = EngagedPatronsAdapter(
                    library_id=lib_id,
                    site_id=config.get('site_id')
                )

            elif platform == "google":
                scraper = GoogleCalendarAdapter(
                    library_id=lib_id,
                    calendar_id=config.get('calendar_id')
                )

            elif platform == "library_calendar":
                scraper = LibraryCalendarAdapter(
                    library_id=lib_id,
                    target_url=config.get('base_url')
                )

            elif platform == "my_calendar":
                scraper = MyCalendarAdapter(
                    library_id=lib_id,
                    target_url=config.get('base_url')
                )

            elif platform == "modern_tribe":
                scraper = ModernTribeAdapter(
                    library_id=lib_id,
                    target_url=(config.get('base_url'))
                )
                
            else:
                print(f"⚠️ Warning: Unknown platform '{platform}' for {lib_name}. Skipping.")

            # --- API POST LOGIC ---
            if scraper:
                events = scraper.run()    
                
                if events:
                    print(f"🚀 Pushing {len(events)} events to the database via API...")
                    success_count = 0
                    
                    for event in events:
                        # Convert using the model's built-in timezone-aware method
                        event_payload = event.to_dict()

                        # Send it to Next.js!
                        try:
                            response = requests.post(API_URL, json=event_payload, headers=HEADERS)
                            if response.status_code == 201:
                                success_count += 1
                            else:
                                print(f"⚠️ API Error for '{event.title}': {response.status_code} - {response.text}")
                        except Exception as req_err:
                            print(f"❌ Connection Error for '{event.title}': {req_err}")
                            
                    print(f"✅ Successfully inserted {success_count}/{len(events)} events for {lib_name}.")

        except Exception as e:
            print(f"❌ Error running {platform} adapter for {lib_name}: {e}")

    print("\n✅ All scheduled scraping tasks completed.")

if __name__ == "__main__":
    main()