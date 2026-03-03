import re

# A list of exact substrings that indicate a private room booking
EXCLUSION_KEYWORDS = [
    "(comm)", 
    "room reservation",
    "private event",
    "baby shower",
    "baby sprinkle",
    "birthday party",
    "private meeting",
    "staff only",
    "closed for",
    "cancelled",
    "canceled",
    "postponed",
    "room reserved"
]

def is_public_event(title: str, description: str) -> bool:
    """Checks if an event contains known private booking keywords."""
    # Combine and lowercase everything for easy searching
    clean_title = re.sub(r'\s+', ' ', title).strip().lower()
    clean_desc = re.sub(r'\s+', ' ', description or "").strip().lower()
    
    search_text = f"{clean_title} {clean_desc}"
    
    for keyword in EXCLUSION_KEYWORDS:
        if keyword.lower() in search_text:
            print(f"{search_text} is a private event.")
            return False # It's a private event!
            
    return True # It's safe for the public!