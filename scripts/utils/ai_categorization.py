import google.generativeai as genai
import json
import os
from utils.categorization import CATEGORY_ID_MAP

def get_ai_category(title: str, description: str) -> dict:
    """
    Calls Gemini to categorize an event. 
    Returns a dict with 'category_ids' (a list) and 'reasoning'.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"category_ids": [], "reasoning": "No API key found."}

    genai.configure(api_key=api_key)
    
    # We will use the ultra-fast 8B model as discussed!
    model = genai.GenerativeModel(
        'gemini-1.5-flash-8b',
        generation_config={"response_mime_type": "application/json"}
    )

    valid_categories = list(CATEGORY_ID_MAP.keys())

    # ZERO-SHOT PROMPT: Lean and simple, asking for an array.
    prompt = f"""
    You are a library event classifier. Categorize this event using between 1 and 3 of the following categories:
    {valid_categories}

    You must return a JSON object with exactly two keys: 
    1. 'categories' (a JSON array containing 1 to 3 strings from the list above, ordered by relevance)
    2. 'reasoning' (a short 1-sentence explanation of your choices)

    Title: {title}
    Description: {description}
    """

    try:
        response = model.generate_content(prompt)
        ai_result = json.loads(response.text)
        
        # Grab the array of strings (default to empty list if missing)
        category_keys = ai_result.get('categories', [])
        reasoning = ai_result.get('reasoning', 'No reasoning provided.')
        
        # Failsafe: Ensure it didn't give us more than 3
        category_keys = category_keys[:3]
        
        # Convert the strings to your database IDs
        category_ids = []
        for key in category_keys:
            # We use .lower() just in case the AI capitalized it
            cat_id = CATEGORY_ID_MAP.get(key.lower())
            if cat_id:
                category_ids.append(cat_id)
        
        return {
            "category_ids": category_ids, # Notice this is now a list!
            "reasoning": reasoning
        }

    except Exception as e:
        print(f"⚠️ AI Categorization Error for '{title}': {e}")
        return {"category_ids": [], "reasoning": f"Error: {e}"}