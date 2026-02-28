import os
import psycopg2
import requests 
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from utils.db_cleanup import prune_past_events
from adapters.assabet import AssabetAdapter
from adapters.libcal import LibCalAdapter  

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
    
    # 1. Load environment variables
    load_dotenv('../.env.local') 

    # 2. Prune old events from the database
    prune_past_events()

    # 3. Fetch the live library list from Neon
    libraries = fetch_libraries_from_db()

    if not libraries:
        print("⚠️ No libraries found in database. Exiting.")
        return

    # Setup API configuration
    API_URL = os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:3000') + '/api/events'
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

            elif platform == "google":
                print(f"⌛ Adapter for 'google' is not yet implemented. Skipping.")
                
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