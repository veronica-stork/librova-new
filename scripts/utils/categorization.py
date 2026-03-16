import re

# IMPORTANT: If you change these IDs, you MUST update lib/constants.ts and the Neon database.
CATEGORY_ID_MAP = {
    "storytime": 1, "crafts": 2, "book_talks": 3, "games": 4, 
    "history": 5, "health": 6, "stem": 7, "teens": 8, 
    "adults": 9, "family": 10, "children": 11,
    "early_childhood": 12, "tech_help": 13, "special_needs": 14, 
    "languages": 15, "music": 16, "money": 17, "gardening": 18, "cooking": 19,
    "literacy": 20, "movies": 21, "virtual": 22, "seniors": 23, "lgbtq": 24
}

event_categories = {
    "storytime": [
        "storytime", "story time", "story-time", "read aloud", "read-aloud", 
        "toddler time", "rhymes", "nursery rhymes", "bilingual storytime", 
        "read to", "tales", "lapsit", "bedtime story", "wiggles",
        "fingerplay", "mother goose"
    ],
    "history": [
        "history"
    ],
    "early_childhood": [
        "twos", "threes", "two-year-olds", "three-year-olds", "pre-k", 
        "preschool", "toddler", "kindergarten", "early literacy", "playgroup"
    ],
    "crafts": [
        "craft", "diy", "make and take", "make & take", "origami", 
        "painting", "knitting", "crochet", "sewing", "scrapbooking", 
        "drawing", "maker", "watercolor", "yarn", "papercraft",
        "quilter", "quilting", "crafter", "needlework", "embroidery", "mixed media", "collage", 
        "junk journaling", "candle making", "zines"
    ],
    "stem": [
        "stem", "steam", "coding", "robotics", "lego", "science", 
        "math", "experiment", "engineering", "technology", "3d printing", 
        "python", "physics", "astronomy", "outer space", "computer science", "minecraft"
    ],
    "tech_help": [
        "tech help", "computer help", "smart phone", "ipad", 
        "tablet", "device advice", "tech tutor", "software help", "digital literacy", "technology help", 
        "technology questions", "tech questions"
    ],
    "health": ["nutrition", "diet", "zumba", "pilates", "tai chi", "qigong", "yoga", 
               "self-care", "wellness", "meditation", "mindfulness", "stress", 
               "mental health", "grief", "alzheimer's", "dementia", "depression", "support group", 
               "cardio", "strength training", "aerobics", "narcan", "addiction", "cpr", "first aid"],
    "book_talks": [
        "book club", "book discussion", "author visit", "book talk", 
        "author talk", "literature", "reading group", "chapter chat", 
        "meet the author", "book review", "mystery book club", "page turner"
    ],
    "games": [
        "board game", "video game", "trivia", "bingo", "chess", 
        "mahjong", "mah jong", "d&d", "dungeons and dragons", "dungeons & dragons", "scrabble", 
        "puzzle", "esports", "gaming", "nintendo switch", "tabletop", "wii", "mah jongg",
        "pokemon", "pokémon", "magic: the gathering", "mah-jongg", "mah-jong", "canasta", "play bridge"
    ],
    "special_needs": [
        "all abilities", "sensory-friendly", "adaptive", "special needs"
    ],
    "languages": [
        "esl", "english as a second language", "ell", "english learners", 
        "language learning", "conversation group", "learn french", "learn spanish", "learn german",
        "learn chinese", "learn portuguese", "learn italian", "practice spanish", "practice italian",
        "practice german", "practice chinese", "practice portuguese", "practice french", "french conversation",
        "german conversation", "chinese conversation", "portuguese conversation", "spanish conversation", 
        "italian conversation"
    ],
    "teens": ["teen", "youth", "grades 6-12", "middle school", "high school", "ya", "young adult", "grades 7-12", "adolescent"],
    "adults": ["adult", "18+", "seniors", "elder", "21+", "18+", "adults only", "retirement", "medicare"],
    "children": ["kid", "child", "baby", "babies", "elementary", "tween", "grades k-5"],
    "family": ["family", "all ages", "intergenerational", "parents", "caregiver", "family-friendly"],
    "music": ["music", "concert", "performance", "recital", "symphony", "gig", "acoustic", "band", "instruments",
              "choir", "ensemble", "live music", "ukulele", "guitar", "piano", "drums", "fiddle", "violin", 
              "strings", "percussion", "orchestra", "brass", "woodwind", "jam session", "sing-along", "karaoke", 
              "open mic", "musical theater", "opera", "songwriting", "chorus"],
    "money": ["money", "budgeting", "savings", "debt", "credit score", "investing", "retirement", "401k", 
              "ira", "personal finance", "wealth", "financial planning", "tax prep", "aarp tax-aide", 
              "vita", "irs", "tax filing", "property tax", "tax exemptions", "income tax", "power of attorney", 
              "estate planning", "probate", "social security", "medicare", "insurance",
              "identity theft", "fraud prevention", "scam alert", "homebuyer", "real estate"],
    "gardening": ["garden", "plant", "gardening"],
    "cooking": ["cooking", "cook", "prepare a meal", "cookbook"],
    "literacy": ["literacy", "learn to read", "reading buddies", "book buddies"],
    "movies": ["movie", "movies", "film", "cinema", "matinee"],
    "virtual": ["zoom", "online event", "virtual event", "virtual"],
    "seniors": ["seniors", "65+", "older adults"],
    "lgbtq": ["lgbtq", "lgbtqa", "queer"]
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
    1: [2, 16], # Storytime consumes: Crafts, Music
    12: [11, 10], # Early childhood consumes: Children
    13: [7] # Tech help consumes STEM
}

def extract_category_ids(title: str, description: str) -> list[int]:
    """Scans text for keywords and returns a deduplicated list of category IDs."""
    text_to_search = f"{title or ''} {description or ''}".lower()


    # Identify negations (adult only, no kids allowed events)
    is_adult_only = any(phrase in text_to_search for phrase in [
        "no kids", "adults only", "18+", "21+", "no children", "grown-ups only"
    ])

    # Phrases that contain the word "adult" but are children's events
    participation_phrases = [
        "adult must be present",
        "adult participation required",
        "with an adult",
        "accompanied by an adult",
        "adult supervision",
        "parent or caregiver"
    ]

    # Check if this is actually a requirement, not a demographic
    is_participation_requirement = any(p in text_to_search for p in participation_phrases)

# --- 🧽 THE CONTEXT SCRUBBER ---
    # Remove phrases that can cause incorrect categorization, e.g. we want "art" to be categorized as crafts,
    # but not if it is part of the phrase "martial arts", "state of the art", etc.
    false_positive_phrases = [
        # English language weirdness
        "the art of", 
        "martial art", 
        "martial arts", 
        "state of the art",
        "science of",
        "wealth of knowledge",
        # Location based exclusions
        "history room",
        "art room",
        "meeting room",
        "children's room",
        "kids room",
        "childrens room",
        "teen room"
    ]

    for phrase in false_positive_phrases:
        text_to_search = text_to_search.replace(phrase, " ")   
    
    # --- REGEX SCANNING ---
    matched_ids = set()
    for category, pattern in COMPILED_RULES.items():
        if pattern.search(text_to_search):
            cat_id = CATEGORY_ID_MAP[category]

            # Don't add "children" as category for adults only events
            if is_adult_only and cat_id in [11, 12]:
                continue

            # If we found 'adult' keywords but it's just a participation requirement,
            # don't tag it as an Adult (9) program.
            if cat_id == 9 and is_participation_requirement:
                continue
                                            
            matched_ids.add(cat_id)
            
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