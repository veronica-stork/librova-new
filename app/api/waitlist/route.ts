import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();
    const sql = neon(process.env.DATABASE_URL!);
    const isStaff = source === 'staff';

    // 1. Save to Neon
    await sql`
      INSERT INTO waitlist (email, source) 
      VALUES (${email}, ${source || 'user'})
      ON CONFLICT (email) DO NOTHING;
    `;

    // 2. Define Email Content based on Source
    const subject = isStaff 
      ? "Colleague-to-Colleague: Librova Staff Beta" 
      : "Welcome to the Librova Waitlist!";

    const htmlContent = isStaff ? `
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6;">
        <h1 style="color: #0d9488;">Hi Colleague!</h1>
        <p>Thanks for your interest in the Librova Staff Beta. As a fellow MHLS Director, I know the struggle of keeping our community informed about all the great work we do.</p>
        <p>I'm tagging your account for <strong>Priority Staff Access</strong>. This means you'll be among the first to test the Director-level dashboard where you can verify your library's data.</p>
        <p>I'd love to hear your thoughts on how we can make this more useful for our branches. I'll reach out personally soon.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">
          <strong>Veronica Stork</strong><br />
          Creator of Librova
        </p>
      </div>
    ` : `
      <div style="font-family: sans-serif; color: #334155;">
        <h1 style="color: #0d9488;">Welcome to Librova!</h1>
        <p>Thanks for joining the waitlist. I'm building Librova to make it easier to find library events in the Mid-Hudson system.</p>
        <p>We'll let you know as soon as the app goes live for your area!</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Veronica Stork, Creator of Librova</p>
      </div>
    `;

    // 3. Send the Email
    await resend.emails.send({
      from: 'Librova <onboarding@resend.dev>', // Change to your domain later
      to: email,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}