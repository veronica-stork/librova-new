// app/api/events/nearby/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 1. Parse and validate query parameters
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const radiusMiles = parseFloat(searchParams.get('radius') || '10');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // 2. Initialize Neon connection
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // 3. Execute spatial join query
    // We cast to ::geography to ensure distance is measured in meters on a sphere
    const events = await sql`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.start_time, 
        e.end_time,
        e.category,
        l.name as library_name,
        l.address,
        ST_Distance(
          l.location, 
          ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography
        ) / 1609.34 as distance_miles
      FROM events e
      JOIN libraries l ON e.library_id = l.id
      WHERE ST_DWithin(
        l.location, 
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography, 
        ${radiusMiles} * 1609.34
      )
      AND e.start_time >= NOW()
      ORDER BY e.start_time ASC
      LIMIT 100;
    `;

    return NextResponse.json(events);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}