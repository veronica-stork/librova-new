import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Basic Security: Check for a secret API key
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SCRAPER_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Initialize Neon connection
    const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || '');

    // 3. Parse the incoming JSON payload
    const event = await request.json();
    
    // 4. Destructure the payload (No default library_id!)
    const {
      library_id,
      title,
      description,
      start_time,
      end_time = null, 
      registration_link = null,
      category_ids = [], 
    } = event;

    // 5. Explicit Validation
    if (!library_id || !title || !start_time) {
      return NextResponse.json(
        { error: 'Missing required fields: library_id, title, or start_time' }, 
        { status: 400 }
      );
    }

    // 6. Insert into PostgreSQL
// 6. Insert into PostgreSQL with UPSERT logic
const result = await sql`
  INSERT INTO events (
    library_id, title, description, start_time, end_time, registration_link, category_ids
  )
  VALUES (
    ${library_id}, ${title}, ${description}, ${start_time}, ${end_time}, ${registration_link}, ${category_ids}::int[]
  )
  ON CONFLICT (library_id, title, start_time) 
  DO UPDATE SET 
    category_ids = EXCLUDED.category_ids,
    description = EXCLUDED.description,
    registration_link = EXCLUDED.registration_link
  RETURNING *;
`;

    // Neon returns an array of rows directly
    return NextResponse.json({ success: true, inserted: result.length > 0 }, { status: 201 });

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to insert event' }, { status: 500 });
  }
}