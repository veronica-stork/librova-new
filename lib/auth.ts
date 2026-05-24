import { auth, currentUser } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

export interface AuthSession {
  userId: string;
  internalId: number | null;
  isSuperAdmin: boolean;
  libraryId: number | null;
  isApproved: boolean;
}

/**
 * Ensures the currently logged-in Clerk user exists in Librova's local Postgres DB,
 * then evaluates their operational role & assigned library context.
 */
export async function checkAndSyncAuth(): Promise<AuthSession | null> {
  const { userId } = await auth();
  const user = await currentUser();

  // If not logged into Clerk, return null immediately so the page can render sign-in prompts
  if (!userId || !user) {
    return null;
  }

  const sql = neon(process.env.DATABASE_URL!);
  const primaryEmail = user.emailAddresses[0]?.emailAddress || '';
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';

  // 1. Just-In-Time (JIT) Sync: Upsert the user profile row into the database
  // Using ON CONFLICT to ignore subsequent syncs safely without crashing
  await sql`
    INSERT INTO users (auth_id, email, first_name, last_name, is_super_admin)
    VALUES (${userId}, ${primaryEmail}, ${firstName}, ${lastName}, false)
    ON CONFLICT (auth_id) DO UPDATE
    SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
  `;

  // 2. Fetch the actual user profile configuration to check role assignment
  const userRecord = await sql`
    SELECT id, is_super_admin 
    FROM users 
    WHERE auth_id = ${userId}
    LIMIT 1
  `;
  
  const internalId = userRecord[0]?.id || null;
  const isSuperAdmin = userRecord[0]?.is_super_admin === true;

// 3. Resolve localized Library Staff affiliation if they aren't a super admin
  let libraryId = null;
  let isApproved = false;

  if (!isSuperAdmin && internalId) {
    const staffRecord = await sql`
      SELECT library_id, is_approved 
      FROM library_staff 
      WHERE user_id = ${internalId}
      LIMIT 1
    `;
    libraryId = staffRecord[0]?.library_id || null;
    isApproved = staffRecord[0]?.is_approved === true;
  } else if (isSuperAdmin) {
    isApproved = true;
  }

  return {
    userId,
    internalId,
    isSuperAdmin,
    libraryId,
    isApproved
  };
}