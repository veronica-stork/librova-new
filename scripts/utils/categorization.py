import re
from typing import List

# 1. Map your string keys to the provided database IDs
# Updated IDs for your DB: 
# 12-Early Childhood, 13-Tech Help, 14-Special Needs, 15-ESL/Language
CATEGORY_ID_MAP = {
    "storytime": 1, "crafts": 2, "book_talks": 3, "games": 4, 
    "history": 5, "health": 6, "stem": 7, "teens": 8, 
    "adults": 9, "family": 10, "children": 11,
    "early_childhood": 12, "tech_help": 13, "special_needs": 14, "esl": 15
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
        "quilter", "quilting", "crafter", "needlework", "embroidery"
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
    "book_talks": [
        "book club", "book discussion", "author visit", "book talk", 
        "author talk", "literature", "reading group", "chapter chat", 
        "meet the author", "book review", "mystery book club", "page turner"
    ],
    "games": [
        "board game", "video game", "trivia", "bingo", "chess", 
        "mahjong", "mah jong", "d&d", "dungeons and dragons", "scrabble", 
        "puzzle", "esports", "gaming", "switch", "tabletop"
    ],
    "special_needs": [
        "all abilities", "sensory-friendly", "adaptive", "special needs", 
        "inclusive", "neurodiversity", "neurodivergent"
    ],
    "esl": [
        "esl", "english as a second language", "ell", "english learners", 
        "language learning", "conversation group", "french", "spanish", "italian"
    ],
    "teens": ["teen", "youth", "grades 6-12", "middle school", "high school", "ya", "young adult", "grades 7-12", "adolescent"],
    "adults": ["adult", "18+", "seniors", "elder", "21+", "adults only", "retirement", "medicare"],
    "children": ["kid", "child", "baby", "babies", "elementary", "tween", "grades k-5"],
    "family": ["family", "all ages", "intergenerational", "parents", "caregiver", "family-friendly"]
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

def extract_category_ids(title: str, description: str) -> list[int]:
    # Normalize text: convert to lowercase and remove some common noise
    # We keep the text mostly intact so the regex boundaries still work
    text_to_search = f"{title or ''} {description or ''}".lower()
    
    matched_ids = set()
    for category, pattern in COMPILED_RULES.items():
        if pattern.search(text_to_search):
            matched_ids.add(CATEGORY_ID_MAP[category])
            
    return list(matched_ids)
# --- Example Usage ---
if __name__ == "__main__":
    sample_title = "Intro to Python for Middle Schoolers"
    sample_desc = "Join us to learn basic coding concepts. Grades 6-12 welcome. Laptops provided."
    
    # Expects STEM (7) and Teens (8)
    ids = extract_category_ids(sample_title, sample_desc)
    print(f"Matched IDs: {ids}")