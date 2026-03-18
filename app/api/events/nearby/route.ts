export const dynamic = 'force-dynamic'; 

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Existing Params
  const libraryParam = searchParams.get('library');
  const sortParam = searchParams.get('sort') || 'time'; 
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const radiusMiles = parseFloat(searchParams.get('radius') || '15');
  
  // New Params for Search & Date
  const q = searchParams.get('q') || '';
  const dateFilter = searchParams.get('date') || 'today';
  const clientTime = searchParams.get('clientTime') || '00:00:00';
  
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

  const searchPattern = `%${q}%`;
  const sql = neon(process.env.DATABASE_URL!);

  // A helper to inject the strict date logic into both queries, localized to NY time
  const getDateFilterSQL = () => {
    switch (dateFilter) {
      case 'today':
        return sql`AND (e.start_time AT TIME ZONE 'America/New_York')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date AND (e.start_time AT TIME ZONE 'America/New_York')::time >= ${clientTime}::time`;
      case 'tomorrow':
        return sql`AND (e.start_time AT TIME ZONE 'America/New_York')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date + INTERVAL '1 day'`;
      case 'weekend':
        return sql`AND EXTRACT(ISODOW FROM (e.start_time AT TIME ZONE 'America/New_York')) IN (6, 7) AND (e.start_time AT TIME ZONE 'America/New_York')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date AND (e.start_time AT TIME ZONE 'America/New_York')::date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date + INTERVAL '6 days'`;
      case 'all':
      default:
        // For 'all', just show everything from right now onwards
        return sql`AND (e.start_time AT TIME ZONE 'America/New_York') >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')`;
    }
  };

  try {
    let events;

    if (hasLocation) {
      // Query WITH geographic filtering (PostGIS)
      events = await sql`
        SELECT 
          e.id, e.title, e.description, e.start_time, e.end_time, e.event_url, e.category_ids, e.primary_category_id,
          l.name as library_name, l.address,
          ST_Distance(l.location::geography, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography) / 1609.34 as distance_miles
        FROM events e
        JOIN libraries l ON e.library_id = l.id
        WHERE ST_DWithin(l.location::geography, ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography, ${radiusMiles} * 1609.34)
        
        ${getDateFilterSQL()}
        ${q ? sql`AND (e.title ILIKE ${searchPattern} OR e.description ILIKE ${searchPattern})` : sql``}
        ${categoryIds.length > 0 ? sql`AND e.category_ids && ${categoryIds}::int[]` : sql``}
        ${libraryParam ? sql`AND l.name ILIKE ${'%' + libraryParam + '%'}` : sql``} 
        
        ORDER BY 
        ${sortParam === 'distance' 
          ? sql`DATE(e.start_time) ASC, distance_miles ASC, e.start_time ASC` 
          : sql`e.start_time ASC`
        }
        LIMIT 500;
      `;
    } else {
      // Query WITHOUT geographic filtering (All system events)
      events = await sql`
        SELECT 
          e.id, e.title, e.description, e.start_time, e.end_time, e.event_url, e.category_ids, e.primary_category_id,
          l.name as library_name, l.address,
          NULL as distance_miles
        FROM events e
        JOIN libraries l ON e.library_id = l.id
        WHERE 1=1 

        ${getDateFilterSQL()}
        ${q ? sql`AND (e.title ILIKE ${searchPattern} OR e.description ILIKE ${searchPattern})` : sql``}
        ${categoryIds.length > 0 ? sql`AND e.category_ids && ${categoryIds}::int[]` : sql``}
        ${libraryParam ? sql`AND l.name ILIKE ${'%' + libraryParam + '%'}` : sql``}
        
        ORDER BY e.start_time ASC
        LIMIT 100;
      `;
    }

    // Server-side formatting (Intact from your original code)
    const formattedEvents = events.map(event => {
      const eventDate = new Date(event.start_time);
      const timeZone = 'America/New_York';

      // Format the time to NY time first
      const nyTimeString = eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', timeZone 
      });

      // If the scraper defaulted it to midnight local time, we assume it's All Day
      const isAllDay = nyTimeString === "12:00 AM";

      return {
        id: event.id,
        title: event.title,
        libraryName: event.library_name,
        date: eventDate.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric', timeZone 
        }),
        // Use our new boolean to either show the NY time or "All Day"
        time: isAllDay ? "All Day" : nyTimeString,
        description: event.description || "No description provided.",
        sourceUrl: event.event_url || "#",
        category_ids: event.category_ids || [],
        primary_category_id: event.primary_category_id || null,
        distance: event.distance_miles !== null ? Math.round(event.distance_miles * 10) / 10 : null 
      };
    });

    return NextResponse.json(formattedEvents);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}