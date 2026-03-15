import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Initialize Neon connection
    const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || '');

    // 2. Fetch libraries using tagged template literals
    // We use ST_Y and ST_X to easily pull the lat/lng out of your GEOGRAPHY column
    const libraries = await sql`
      SELECT 
        id, 
        name, 
        address, 
        calendar_status,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng,
        website_url
      FROM libraries
      ORDER BY name ASC;
    `;

    // 3. Neon serverless returns the rows directly as an array of objects
    return NextResponse.json(libraries, { status: 200 });

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch libraries' }, { status: 500 });
  }
}