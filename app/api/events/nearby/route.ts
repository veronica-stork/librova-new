export const dynamic = 'force-dynamic'; 

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const radiusMiles = parseFloat(searchParams.get('radius') || '15');

  // Determine if location data was provided
  const hasLocation = latParam !== null && lngParam !== null;
  const lat = hasLocation ? parseFloat(latParam) : null;
  const lng = hasLocation ? parseFloat(lngParam) : null;

  // Parse categories into an array of numbers
  const categoriesParam = searchParams.get('categories');
  const categoryIds = categoriesParam 
    ? categoriesParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    : [];

  // Only throw an error if location params exist but are invalid
  if (hasLocation && (isNaN(lat!) || isNaN(lng!))) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  try {
    let events;

    if (hasLocation) {
      // Query WITH geographic filtering
      events = await sql`
        SELECT 
          e.id, e.title, e.description, e.start_time, e.end_time, e.event_url, e.category_ids, 
          l.name as library_name, l.address,
          ST_Distance(l.location, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography) / 1609.34 as distance_miles
        FROM events e
        JOIN libraries l ON e.library_id = l.id
        WHERE ST_DWithin(l.location, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography, ${radiusMiles} * 1609.34)
        AND e.start_time >= NOW()
        ${categoryIds.length > 0 ? sql`AND e.category_ids && ${categoryIds}::int[]` : sql``}
        ORDER BY e.start_time ASC
        LIMIT 100;
      `;
    } else {
      // Query WITHOUT geographic filtering (All system events)
      events = await sql`
        SELECT 
          e.id, e.title, e.description, e.start_time, e.end_time, e.event_url, e.category_ids, 
          l.name as library_name, l.address,
          NULL as distance_miles
        FROM events e
        JOIN libraries l ON e.library_id = l.id
        WHERE e.start_time >= NOW()
        ${categoryIds.length > 0 ? sql`AND e.category_ids && ${categoryIds}::int[]` : sql``}
        ORDER BY e.start_time ASC
        LIMIT 100;
      `;
    }

    const formattedEvents = events.map(event => {
      const eventDate = new Date(event.start_time);
      
      return {
        id: event.id,
        title: event.title,
        libraryName: event.library_name,
        date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        description: event.description || "No description provided.",
        sourceUrl: event.event_url || "#",
        category_ids: event.category_ids || [],
        // Safely handle null distances so the frontend doesn't render "0 miles away"
        distance: event.distance_miles !== null ? Math.round(event.distance_miles * 10) / 10 : null 
      };
    });

    return NextResponse.json(formattedEvents);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}