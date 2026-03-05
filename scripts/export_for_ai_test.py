import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

def export_events():
    load_dotenv('../.env.local') # Adjust path if needed
    conn_string = os.getenv('DATABASE_URL')
    
    query = """
    SELECT id, title, description 
    FROM events 
    ORDER BY created_at DESC 
    LIMIT 50;
    """
    
    try:
        with psycopg2.connect(conn_string, cursor_factory=RealDictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                events = cur.fetchall()
                
        with open('test_events.json', 'w') as f:
            json.dump(events, f, indent=2)
            
        print(f"✅ Exported {len(events)} events to test_events.json")
    except Exception as e:
        print(f"❌ DB Error: {e}")

if __name__ == "__main__":
    export_events()