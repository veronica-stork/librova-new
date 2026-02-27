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
    "closed for"
]

def is_public_event(title: str, description: str) -> bool:
    """Checks if an event contains known private booking keywords."""
    # Combine and lowercase everything for easy searching
    search_text = f"{title} {description}".lower()
    
    for keyword in EXCLUSION_KEYWORDS:
        if keyword.lower() in search_text:
            return False # It's a private event!
            
    return True # It's safe for the public!