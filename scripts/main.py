import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from utils.db_cleanup import prune_past_events
from adapters.assabet import AssabetAdapter

def fetch_libraries_from_db():
    """Fetches all library records from the PostgreSQL database."""
    conn_string = os.getenv('DATABASE_URL') # Ensure this is in your .env.local
    libraries = []
    
    try:
        # Using RealDictCursor allows us to access columns by name like lib['calendar_type']
        with psycopg2.connect(conn_string, cursor_factory=RealDictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, calendar_type, calendar_url FROM libraries;")
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

    # 4. Route and run the appropriate adapters
    for lib in libraries:
        lib_name = lib['name']
        lib_type = lib['calendar_type']
        lib_id = lib['id']
        lib_url = lib['calendar_url']

        print(f"\n{'='*50}")
        print(f"📅 Processing: {lib_name}")
        print(f"Type: {lib_type or 'None'} | ID: {lib_id}")
        print(f"{'='*50}")
        
        # Guard clause for missing URLs or types
        if not lib_type or not lib_url:
            print(f"⏭️ Skipping {lib_name}: Missing calendar_type or calendar_url.")
            continue

        if lib_type == "assabet":
            try:
                scraper = AssabetAdapter(library_id=lib_id, target_url=lib_url)
                scraper.run()
            except Exception as e:
                print(f"❌ Error running AssabetAdapter for {lib_name}: {e}")
            
        elif lib_type in ["libcal", "google"]:
            print(f"⌛ Adapter for '{lib_type}' is not yet implemented. Skipping.")
            
        else:
            print(f"⚠️ Warning: Unknown calendar type '{lib_type}' for {lib_name}. Skipping.")

    print("\n✅ All scheduled scraping tasks completed.")

if __name__ == "__main__":
    main()