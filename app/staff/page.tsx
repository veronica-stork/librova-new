import { SignInButton, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';
import { neon } from '@neondatabase/serverless';
import { checkAndSyncAuth } from '@/lib/auth';
import VerifyRow from '@/components/VerifyRow';
import OnboardingForm from '@/components/OnboardingForm';

export default async function StaffPage() {
  const session = await checkAndSyncAuth();

  // GATEWAY 1: Not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Librova Staff Portal</h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <SignInButton mode="modal" fallbackRedirectUrl="/staff" signUpFallbackRedirectUrl="/staff">
              <button className="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-medium">
                Sign in to continue
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  const sql = neon(process.env.DATABASE_URL!);

  // GATEWAY 2: New user, needs to pick a library & enter name (Onboarding)
  if (!session.libraryId && !session.isSuperAdmin) {
    
    // 1. Fetch the raw, untyped data from the database
    const rawLibraries = await sql`SELECT id, name FROM libraries ORDER BY name ASC`;

    // 2. Explicitly map the untyped data into a strict format
    const libraries = rawLibraries.map((row) => ({
      id: Number(row.id),
      name: String(row.name)
    }));

    return <OnboardingForm session={session} libraries={libraries} />;
  }

  // GATEWAY 3: Requested access, waiting for admin approval
  if (session.libraryId && !session.isApproved && !session.isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full p-8 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-center shadow-sm">
          <h2 className="text-xl font-bold mb-2">Access Pending</h2>
          <p>Your request is currently being reviewed by the Librova team. Please check back later!</p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  // GATEWAY 4: Fully authorized Dashboard
  // Removed ai_primary_category_id from this query!
  const unverifiedEvents = await sql`
    SELECT id, title, description, start_time, primary_category_id 
    FROM events 
    WHERE human_verified = false 
    AND (
      ${session.isSuperAdmin} = true 
      OR library_id = ${session.libraryId}
    )
    ORDER BY start_time ASC 
    LIMIT 50
  `;

  // 1. Fetch the raw, untyped data
  const rawCategories = await sql`SELECT id, tag_name FROM categories ORDER BY tag_name ASC`;

  // 2. The "Untangle": Map it to the strict shape VerifyRow demands
  const categoriesList = rawCategories.map((row) => ({
    id: Number(row.id),
    tag_name: String(row.tag_name)
  }));
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Building2 className="w-6 h-6 text-blue-600" /> Librova Curation
        </div>
        <SignOutButton />
      </nav>
      
      <main className="max-w-5xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Review Events</h1>
          <p className="text-sm text-gray-500">
            {session.isSuperAdmin ? "Viewing all events globally." : "Viewing localized library events."}
          </p>
        </header>

        {unverifiedEvents.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-white text-gray-500 shadow-sm">
            🎉 All caught up! No events pending review.
          </div>
        ) : (
          <div className="space-y-4">
            {unverifiedEvents.map((event: any) => (
              <VerifyRow key={event.id} event={event} categories={categoriesList} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}