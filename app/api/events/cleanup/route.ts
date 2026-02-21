import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function DELETE(request: Request) {
    // 1. Authenticate the request using the scraper API key
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SCRAPER_API_KEY;

    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
        return NextResponse.json(
            { error: 'Unauthorized' }, 
            { status: 401 }
        );
    }

    // 2. Connect to the database and execute the cleanup
    try {
        // Make sure DATABASE_URL is defined in your .env.local
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not set");
        }

        const sql = neon(process.env.DATABASE_URL); 
        
        // Execute the deletion and return the deleted rows to count them
        const deletedEvents = await sql`
            DELETE FROM events 
            WHERE start_time < NOW() 
            RETURNING id;
        `;
        
        console.log(`🧹 Pruned ${deletedEvents.length} past events from the database.`);

        return NextResponse.json({ 
            success: true, 
            message: 'Past events pruned successfully.',
            deletedCount: deletedEvents.length 
        }, { status: 200 });

    } catch (error: any) {
        console.error('Database cleanup error:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error' }, 
            { status: 500 }
        );
    }
}