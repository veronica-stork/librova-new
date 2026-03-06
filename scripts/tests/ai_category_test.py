import json

try:
    with open('ai_categories.json', 'r') as file:
        ai_data = json.load(file)
except FileNotFoundError:
    print("file not found.")

try:
    with open('re_categories.json', 'r') as file2:
        re_data = json.load(file2)
except FileNotFoundError:
    print("regex file not found")


CATEGORY_ID_MAP = {
    "storytime": 1, "crafts": 2, "book_talks": 3, "games": 4, 
    "history": 5, "health": 6, "stem": 7, "teens": 8, 
    "adults": 9, "family": 10, "children": 11,
    "early_childhood": 12, "tech_help": 13, "special_needs": 14, 
    "languages": 15, "music": 16, "money": 17
}

# 1. Invert the dictionary so we can look up names by their ID number
ID_TO_NAME = {v: k for k, v in CATEGORY_ID_MAP.items()}

# 2. Convert the AI list into a dictionary keyed by event 'id' for instant lookups
ai_dict = {item['id']: item['category_ids'] for item in ai_data}

# 3. Helper function to turn PostgreSQL array strings "{1, 2}" into Python lists [1, 2]
def parse_pg_array(array_str):
    if not array_str or array_str == "{}":
        return []
    # Strip the curly braces and split by comma
    clean_str = array_str.strip("{}")
    return [int(x.strip()) for x in clean_str.split(",") if x.strip()]

print("\n" + "="*50)
print("🔍 CATEGORIZATION COMPARISON: REGEX vs GEMINI")
print("="*50 + "\n")

# 4. Loop through the Regex data (since it has the titles) and compare
for event in re_data:
    event_id = event['id']
    title = event.get('title', 'Unknown Title')
    
    # Clean up the Regex IDs and translate them to words
    raw_re_ids = event.get('category_ids', '{}')
    re_ids = parse_pg_array(raw_re_ids)
    re_categories = [ID_TO_NAME.get(i, f"Unknown({i})") for i in re_ids]
    
    # Grab the matching AI IDs and translate them
    ai_ids = ai_dict.get(event_id, [])
    ai_categories = [ID_TO_NAME.get(i, f"Unknown({i})") for i in ai_ids]
    
    # Print the output
    print(f"Title: {title} (ID: {event_id})")
    print(f"  Regex Tags:  {', '.join(re_categories) if re_categories else 'None'}")
    print(f"  Gemini Tags: {', '.join(ai_categories) if ai_categories else 'None'}")
    print("-" * 50)