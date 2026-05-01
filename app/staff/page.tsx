import { auth } from '@clerk/nextjs/server';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react'; // Make sure you have lucide-react installed!

export default function StaffPage() {
  const { userId } = auth();

  // ==========================================
  // VIEW 1: LOGGED OUT (The Big Rectangle)
  // ==========================================
  if (!userId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        
        {/* The Big Rectangle Card */}
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 text-center relative overflow-hidden">
          
          {/* Decorative background blob */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-50 rounded-full blur-3xl -z-10"></div>
          
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
            Library Staff Portal
          </h2>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed">
            Claim your library to manually add community activities, edit scraped data, and ensure your patrons always have the latest information.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <SignInButton mode="modal">
              <button className="flex-1 bg-teal-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-md">
                Sign In
              </button>
            </SignInButton>
            
            <SignUpButton mode="modal">
              <button className="flex-1 bg-white text-teal-700 border-2 border-teal-100 px-6 py-3.5 rounded-xl font-bold hover:bg-teal-50 transition-colors">
                Create Account
              </button>
            </SignUpButton>
          </div>
        </div>

        {/* Back to Public Site Link */}
        <Link 
          href="/" 
          className="mt-8 flex items-center gap-2 text-slate-500 hover:text-teal-700 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to public event feed
        </Link>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LOGGED IN (The Secure Dashboard)
  // ==========================================
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
          Welcome to your Dashboard
        </h2>
        <p className="text-slate-600 font-medium">
          Manage your library's profile, override scraped events, and add new community activities.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
        <p className="text-sm text-amber-800 font-bold">
          Developer Mode Active: Your Clerk User ID is <span className="font-mono bg-amber-100 px-2 py-1 rounded">{userId}</span>
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            My Libraries
          </h3>
          <p className="text-slate-500 mb-6 font-medium leading-relaxed">
            You currently haven't claimed any libraries. Claiming your library allows you to edit details, upload a logo, and manually manage your calendar events.
          </p>
          <button className="bg-teal-600 text-white px-8 py-3 rounded-full font-bold hover:bg-teal-700 transition-colors shadow-sm">
            Claim a Library
          </button>
        </div>
      </div>
    </div>
  );
}