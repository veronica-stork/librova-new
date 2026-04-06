import os
import requests

def prune_past_events() -> None:
    """
    Triggers the Next.js API to run the cleanup SQL command.
    Removes events from the database that have already occurred.
    """
    print("🧹 Running database cleanup for past events...")
    
    api_key = os.getenv("SCRAPER_API_KEY")
    
    # We grab the base API_URL from the environment, and append /cleanup.
    # This prevents hardcoding localhost so it works in production later.
    base_url = os.getenv("API_BASE_URL", "http://localhost:3000/")
    
    # Ensure we don't end up with double slashes if API_URL has a trailing slash
    base_url = base_url.rstrip('/') 
    cleanup_url = f"{base_url}/api/events/cleanup"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.delete(cleanup_url, headers=headers)
        
        if response.status_code in [200, 204]:
            print("✅ Successfully pruned past events from the database.\n")
        else:
            print(f"❌ Failed to prune events: {response.status_code} - {response.text}\n")
            
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Network error during database cleanup: {e}\n")