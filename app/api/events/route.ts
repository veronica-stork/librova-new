import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Internal route for posting new events.
// This is the route the scraper uses.

export async function POST(request: Request) {
  try {
    // 1. Basic Security: Check for API key
    const authHeader = request.headers.get('authorization');
    const serverKey = process.env.SCRAPER_API_KEY;

    if (!serverKey) {
      return NextResponse.json({ error: 'Vercel is missing the key completely!' }, { status: 401 });
    }
    
    if (authHeader !== `Bearer ${process.env.SCRAPER_API_KEY}`) {
      console.log(`Auth header: ${authHeader}`)
      return NextResponse.json({ 
        error: 'Keys do not match', 
        youSent: authHeader,
        hint: `Server key length is ${serverKey.length} characters`
      }, { status: 401 });
    }

    // 2. Initialize Neon connection
    const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || '');

    // 3. Parse the incoming JSON payload
    const event = await request.json();
    
    // 4. Destructure the payload (NEW AI FIELDS ADDED)
    const {
      library_id,
      title,
      description,
      start_time,
      end_time = null, 
      event_url = null,
      category_ids = [], 
      primary_category_id = null,
      ai_category_ids = [],
      ai_primary_category_id = null,
      ai_reasoning = null
      // We don't pull human_verified from the scraper, because the scraper 
      // doesn't know if a human verified it. We handle that entirely in the DB.
    } = event;

    // 5. Explicit Validation
    if (!library_id || !title || !start_time) {
      return NextResponse.json(
        { error: 'Missing required fields: library_id, title, or start_time' }, 
        { status: 400 }
      );
    }

    // 6. Insert into PostgreSQL with UPSERT logic
    const result = await sql`
      INSERT INTO events (
        library_id, title, description, start_time, end_time, event_url, 
        category_ids, primary_category_id,
        ai_category_ids, ai_primary_category_id, ai_reasoning, human_verified
      )
      VALUES (
        ${library_id}, ${title}, ${description}, ${start_time}, ${end_time}, ${event_url}, 
        ${category_ids}::int[], ${primary_category_id},
        ${ai_category_ids}::int[], ${ai_primary_category_id}, ${ai_reasoning}, false
      )
      ON CONFLICT (library_id, title, start_time) 
      DO UPDATE SET 
        description = EXCLUDED.description,
        event_url = EXCLUDED.event_url,
        
        -- Always update the AI's latest guess
        ai_category_ids = EXCLUDED.ai_category_ids,
        ai_primary_category_id = EXCLUDED.ai_primary_category_id,
        ai_reasoning = EXCLUDED.ai_reasoning,

        -- ONLY update the public categories if a human HAS NOT locked them in
        category_ids = CASE WHEN events.human_verified = true THEN events.category_ids ELSE EXCLUDED.category_ids END,
        primary_category_id = CASE WHEN events.human_verified = true THEN events.primary_category_id ELSE EXCLUDED.primary_category_id END
        
      RETURNING *;
    `;

    // Neon returns an array of rows directly
    return NextResponse.json({ success: true, inserted: result.length > 0 }, { status: 201 });

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to insert event' }, { status: 500 });
  }
}