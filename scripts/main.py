import os
from dotenv import load_dotenv

# We will build these next based on your new directory structure
from utils.db_cleanup import prune_past_events
from adapters.assabet import AssabetAdapter

def main():
    print("🤖 Starting Librova Scraper Orchestrator...\n")
    
    # 1. Load environment variables
    # Assuming main.py is in /scraper and .env.local is in the root /librova directory
    load_dotenv('../.env.local') 

    # 2. Prune old events from the database
    # This runs once globally before any new data is fetched
    prune_past_events()

    # 3. Define the libraries to scrape
    # Future enhancement: Fetch this list from your PostgreSQL database!
    libraries = [
        {
            "id": 3,
            "name": "Red Hook Public Library",
            "type": "assabet",
            "url": "https://redhooklibrary.assabetinteractive.com/calendar/"
        }
        # You can easily add more libraries here later:
        # {"id": 4, "name": "Another Library", "type": "libcal", "url": "..."}
    ]

    # 4. Route and run the appropriate adapters
    for lib in libraries:
        print(f"\n{'='*50}")
        print(f"📅 Processing: {lib['name']}")
        print(f"{'='*50}")
        
        if lib["type"] == "assabet":
            scraper = AssabetAdapter(library_id=lib["id"], target_url=lib["url"])
            scraper.run()
            
        # elif lib["type"] == "libcal":
        #     scraper = LibCalAdapter(library_id=lib["id"], target_url=lib["url"])
        #     scraper.run()
        
        # elif lib["type"] == "google":
        #     scraper = GoogleCalendarAdapter(library_id=lib["id"], target_url=lib["url"])
        #     scraper.run()
            
        else:
            print(f"⚠️ Warning: Unknown calendar type '{lib['type']}' for {lib['name']}. Skipping.")

    print("\n✅ All scheduled scraping tasks completed.")

if __name__ == "__main__":
    main()