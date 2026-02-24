import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const radiusMiles = parseFloat(searchParams.get('radius') || '10');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  try {
    const events = await sql`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.start_time, 
        e.end_time,
        e.category_ids, 
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

    // Map the raw database row to your frontend LibraryEvent interface
    const formattedEvents = events.map(event => {
      const eventDate = new Date(event.start_time);
      
      return {
        id: event.id,
        title: event.title,
        libraryName: event.library_name,
        date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        description: event.description || "No description provided.",
        sourceUrl: "#", 
        category_ids: event.category_ids || [],
        // NEW: Add the distance and round it to 1 decimal place
        distance: Math.round(event.distance_miles * 10) / 10 
      };
    });

    return NextResponse.json(formattedEvents);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}