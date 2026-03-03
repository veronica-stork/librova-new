import os
from dotenv import load_dotenv
from adapters.google import GoogleCalendarAdapter

# Load your GOOGLE_API_KEY from the .env file
load_dotenv()

def run_test():
    # We will test Hudson Area Library first since it's a clean @gmail address
    # You can swap this with the Chatham ID to test that one next!
    test_library_id = 99 
    test_calendar_id = "hudsonarealibraryprograms@gmail.com"
    # test_calendar_id = "chatham.k12.ny.us_4q1anp3sd4i2vtmdabd1r4hktg@group.calendar.google.com"

    print(f"🚀 Starting isolated test for Google Calendar ID: {test_calendar_id}\n")

    # 1. Initialize the adapter
    adapter = GoogleCalendarAdapter(library_id=test_library_id, calendar_id=test_calendar_id)

    # 2. Fetch the raw JSON from Google
    raw_data = adapter.fetch_data()
    
    if not raw_data:
        print("⚠️ No data returned. Check your API key or the Calendar ID.")
        return

    print(f"✅ Successfully fetched {len(raw_data)} raw items from Google API.\n")

    # 3. Normalize the data through your pipeline
    events = adapter.normalize_data(raw_data)

    print(f"🧹 Normalized into {len(events)} StandardizedEvents.\n")
    print("-" * 50)
    
    # 4. Print the results to the terminal
    for event in events:
        print(f"📅 Date:  {event.start_time}")
        print(f"📌 Title: {event.title}")
        print(f"🔗 URL:   {event.event_url}")
        # Truncate description so it doesn't flood your terminal
        desc = event.description[:100].replace('\n', ' ') + "..." if event.description else "No description"
        print(f"📝 Desc:  {desc}")
        print("-" * 50)

if __name__ == "__main__":
    run_test()