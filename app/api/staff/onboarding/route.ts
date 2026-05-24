import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const internalId = Number(formData.get('internalId'));
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const libraryId = Number(formData.get('libraryId'));

    if (!internalId || !libraryId || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Combine both operations into a single query for Serverless safety
    await sql`
      WITH updated_user AS (
        UPDATE users 
        SET first_name = ${firstName}, last_name = ${lastName} 
        WHERE id = ${internalId}
        RETURNING id
      )
      INSERT INTO library_staff (user_id, library_id, is_approved)
      VALUES (${internalId}, ${libraryId}, false)
    `;

    // Fetch details for the email alert
    const user = await sql`SELECT email FROM users WHERE id = ${internalId}`;
    const library = await sql`SELECT name FROM libraries WHERE id = ${libraryId}`;

    // Email notification
    await resend.emails.send({
      from: 'Librova Admin <hello@librova.com>',
      to: process.env.ADMIN_EMAIL!, // Make sure this is in your .env.local!
      subject: 'New Staff Access Request',
      text: `Name: ${firstName} ${lastName} (${user[0].email}) wants access to ${library[0].name}. Please review in the DB.`,
    });

    // Redirect them back to the gatekeeper, which will now show "Access Pending"
    return NextResponse.redirect(new URL('/staff', request.url));
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Onboarding failed' }, { status: 500 });
  }
}