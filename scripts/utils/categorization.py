import re
from typing import List

CATEGORY_ID_MAP = {
    "storytime": 1, "crafts": 2, "book_talks": 3, "games": 4, 
    "history": 5, "health": 6, "stem": 7, "teens": 8, 
    "adults": 9, "family": 10, "children": 11,
    "early_childhood": 12, "tech_help": 13, "special_needs": 14, 
    "languages": 15, "music": 16, "money": 17
}

event_categories = {
    "storytime": [
        "storytime", "story time", "story-time", "read aloud", "read-aloud", 
        "toddler time", "rhymes", "nursery rhymes", "bilingual storytime", 
        "read to", "tales", "lapsit", "bedtime story", "wiggles", "words",
        "fingerplay", "tunes", "songs", "mother goose"
    ],
    "early_childhood": [
        "twos", "threes", "two-year-olds", "three-year-olds", "pre-k", 
        "preschool", "toddler", "kindergarten", "early literacy", "playgroup"
    ],
    "crafts": [
        "craft", "diy", "make and take", "make & take", "origami", 
        "painting", "knitting", "crochet", "sewing", "scrapbooking", 
        "art", "drawing", "maker", "watercolor", "yarn", "papercraft",
        "quilter", "quilting", "crafter", "needlework", "embroidery", "mixed media", "collage"
    ],
    "stem": [
        "stem", "steam", "coding", "robotics", "lego", "science", 
        "math", "experiment", "engineering", "technology", "3d printing", 
        "python", "physics", "astronomy", "space", "computer science", "minecraft"
    ],
    "tech_help": [
        "tech help", "computer help", "smart phone", "ipad", 
        "tablet", "device advice", "tech tutor", "software help", "digital literacy"
    ],
    "health": ["nutrition", "diet", "zumba", "pilates", "tai chi", "qigong", "yoga", 
               "exercise", "self-care", "wellness", "meditation", "mindfulness", "stress", 
               "mental health", "grief", "alzheimer's", "dementia", "depression", "support group", 
               "cardio", "strength training", "aerobics", "narcan", "addiction", "cpr", "first aid"],
    "book_talks": [
        "book club", "book discussion", "author visit", "book talk", 
        "author talk", "literature", "reading group", "chapter chat", 
        "meet the author", "book review", "mystery book club", "page turner"
    ],
    "games": [
        "board game", "video game", "trivia", "bingo", "chess", 
        "mahjong", "mah jong", "d&d", "dungeons and dragons", "scrabble", 
        "puzzle", "esports", "gaming", "switch", "tabletop", "wii", "mah jongg",
        "pokemon", "magic: the gathering"
    ],
    "special_needs": [
        "all abilities", "sensory-friendly", "adaptive", "special needs", 
        "inclusive", "neurodiversity", "neurodivergent"
    ],
    "languages": [
        "esl", "english as a second language", "ell", "english learners", 
        "language learning", "conversation group", "french", "spanish", "italian"
    ],
    "teens": ["teen", "youth", "grades 6-12", "middle school", "high school", "ya", "young adult", "grades 7-12", "adolescent"],
    "adults": ["adult", "18+", "seniors", "elder", "21+", "adults only", "retirement", "medicare"],
    "children": ["kid", "child", "baby", "babies", "elementary", "tween", "grades k-5"],
    "family": ["family", "all ages", "intergenerational", "parents", "caregiver", "family-friendly"],
    "music": ["music", "concert", "performance", "recital", "symphony", "gig", "acoustic", "band", 
              "choir", "ensemble", "live music", "ukulele", "guitar", "piano", "drums", "fiddle", "violin", 
              "strings", "percussion", "orchestra", "brass", "woodwind", "jam session", "sing-along", "karaoke", 
              "open mic", "musical theater", "opera", "songwriting", "chorus"],
    "money": ["money", "budgeting", "savings", "debt", "credit score", "investing", "retirement", "401k", 
              "ira", "personal finance", "wealth", "financial planning", "tax prep", "aarp tax-aide", 
              "vita", "irs", "tax filing", "property tax", "tax exemptions", "income tax", "power of attorney", 
              "estate planning", "wills", "trusts", "probate", "social security", "medicare", "insurance",
              "identity theft", "fraud prevention", "scam alert", "homebuyer", "real estate"]
}

COMPILED_RULES = {}
for category, keywords in event_categories.items():
    # Sort by length descending
    sorted_keywords = sorted(keywords, key=len, reverse=True)
    
    # NEW: Escape keywords but add an optional 's' at the end of word-based keywords
    # This turns 'lego' into 'legos?' and 'craft' into 'crafts?'
    processed_patterns = []
    for kw in sorted_keywords:
        escaped = re.escape(kw)
        # Only add optional 's' if the keyword ends in a letter (don't do it for "18+")
        if kw[-1].isalpha():
            processed_patterns.append(f"{escaped}s?")
        else:
            processed_patterns.append(escaped)
    
    # Use negative lookbehind/lookahead for word characters 
    # This acts like a word boundary but is safer with symbols
    pattern = r'(?<!\w)(?:' + '|'.join(processed_patterns) + r')(?!\w)'
    COMPILED_RULES[category] = re.compile(pattern, re.IGNORECASE)

HIERARCHY_RULES = {
    1: [2, 11, 12, 16] # Storytime consumes: Crafts, Children, Early Childhood, Music
}

def extract_category_ids(title: str, description: str) -> list[int]:
    """Scans text for keywords and returns a deduplicated list of category IDs."""
    text_to_search = f"{title or ''} {description or ''}".lower()
    
    matched_ids = set()
    for category, pattern in COMPILED_RULES.items():
        if pattern.search(text_to_search):
            matched_ids.add(CATEGORY_ID_MAP[category])
            
    # --- The Deduplicator Logic ---
    ids_to_remove = set()
    for matched_id in matched_ids:
        # If a high-value category was found, mark its children for removal
        if matched_id in HIERARCHY_RULES:
            ids_to_remove.update(HIERARCHY_RULES[matched_id])
            
    # Subtract the children from the final list
    final_ids = matched_ids - ids_to_remove
            
    return list(final_ids)
# --- Example Usage ---
if __name__ == "__main__":
    sample_title = "Intro to Python for Middle Schoolers"
    sample_desc = "Join us to learn basic coding concepts. Grades 6-12 welcome. Laptops provided."
    
    # Expects STEM (7) and Teens (8)
    ids = extract_category_ids(sample_title, sample_desc)
    print(f"Matched IDs: {ids}")