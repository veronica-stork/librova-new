import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const internalId = formData.get('internalId') as string;
    const libraryId = formData.get('libraryId') as string;

    if (!internalId || !libraryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // 1. Insert the request into the staff table (pending approval)
    await sql`
      INSERT INTO library_staff (user_id, library_id, is_approved)
      VALUES (${Number(internalId)}, ${Number(libraryId)}, false)
    `;

    // 2. Fetch user and library details for the email alert
    const user = await sql`SELECT email, first_name, last_name FROM users WHERE id = ${Number(internalId)}`;
    const library = await sql`SELECT name FROM libraries WHERE id = ${Number(libraryId)}`;

    // 3. Send email notification via Resend
    await resend.emails.send({
      from: 'Librova Admin <hello@librova.com>', 
      to: process.env.ADMIN_EMAIL!,
      subject: 'New Staff Access Request',
      text: `User ${user[0].first_name} ${user[0].last_name} (${user[0].email}) requested access for ${library[0].name}. Please review in the DB.`,
    });

    return NextResponse.redirect(new URL('/staff', request.url));
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}