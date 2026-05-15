import json
import os
from google import genai
from google.genai import types
from utils.categorization import CATEGORY_ID_MAP

def get_ai_category(title: str, description: str) -> dict:
    """
    Calls Gemini to categorize an event using the new google-genai SDK.
    Returns a dict with 'category_ids' (a list) and 'reasoning'.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"category_ids": [], "reasoning": "No API key found."}

    # 1. Initialize the new client
    client = genai.Client(api_key=api_key)

    valid_categories = list(CATEGORY_ID_MAP.keys())

    # ZERO-SHOT PROMPT
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
        # 2. Call the model using the new syntax
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        # 3. Parse the result (the new SDK returns text directly on response.text)
        ai_result = json.loads(response.text)
        
        category_keys = ai_result.get('categories', [])
        reasoning = ai_result.get('reasoning', 'No reasoning provided.')
        
        category_keys = category_keys[:3]
        
        category_ids = []
        for key in category_keys:
            cat_id = CATEGORY_ID_MAP.get(key.lower())
            if cat_id:
                category_ids.append(cat_id)
        
        return {
            "category_ids": category_ids,
            "reasoning": reasoning
        }

    except Exception as e:
        print(f"⚠️ AI Categorization Error for '{title}': {e}")
        return {"category_ids": [], "reasoning": f"Error: {e}"}