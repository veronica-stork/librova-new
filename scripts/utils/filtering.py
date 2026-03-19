import re

# A list of exact substrings that indicate a private room booking, a cancelled event, 
# or a meeting (e.g. board meeting) that is public, but not exactly an "event" in the traditional sense.
EXCLUSION_KEYWORDS = [
    "(comm)", 
    "(study)",
    "(conf)",
    "room reservation",
    "reserved",
    "private event",
    "baby shower",
    "baby sprinkle",
    "birthday party",
    "private meeting",
    "private",
    "private party"
    "staff only",
    "closed for",
    "cancelled",
    "canceled",
    "postponed",
    "rescheduled",
    "room reserved",
    "room use",
    "board meeting",
    "board of trustees",
    "meeting of the board of trustees",
    "cancelada",
    "staff training",
    "no class"
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