"use client";

import { useState } from 'react';
import PlausibleProvider from 'next-plausible'

export default function LibrovaWaitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [library, setLibrary] = useState("");

const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();
  setStatus('loading');

  const res = await fetch('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify({ 
      email, 
      source: isStaffMode ? 'staff' : 'user',
      library 
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  if (res.ok) setStatus('success');
  else setStatus('error');
};

  return (
    <PlausibleProvider src="https://plausible.io/js/pa-sg4BID33_L_D4oA_Whr8M.js"></PlausibleProvider>
    <div className="min-h-screen bg-amber-50 text-slate-800 font-sans selection:bg-rose-200 flex flex-col">
      
      {/* Simple Navigation */}
      <nav className="bg-white border-b-4 border-teal-100 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-2xl rotate-3 flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-2xl -rotate-3">L</span>
            </div>
            <h1 className="text-3xl font-extrabold text-teal-900 tracking-tight">Librova</h1>
          </div>
          <div className="flex items-center space-x-8">
  <button 
    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
    className="text-base font-bold text-teal-700 hover:text-rose-500 cursor-pointer transition-colors hidden sm:block"
  >
    About the Project
  </button>
  <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full border-2 border-amber-200 rotate-2">
    Coming Soon
  </span>
</div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        
        {/* Hero Section */}
        <div className="max-w-3xl w-full text-center mb-16">

          <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
            Stop hunting for <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400">
              library events.
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 font-medium mb-10 max-w-2xl mx-auto">
  From Amenia to Woodstock—Librova aggregates every event across the 
  <span className="text-teal-700 font-bold"> 60+ libraries in the Mid-Hudson System </span> 
  into one beautifully searchable feed.
</p>
          {/* Email Capture Card */}
<div className="bg-teal-500 rounded-4xl shadow-[0_8px_0_rgb(15,118,110)] border-4 border-teal-700 p-8 sm:p-10 max-w-xl mx-auto relative group transition-transform hover:-translate-y-1 hover:shadow-[0_12px_0_rgb(15,118,110)]">
  {status === 'success' ? (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-teal-300">
        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-extrabold text-white mb-2">You're on the list!</h3>
      <p className="text-teal-100 font-medium">We'll let you know the second Librova goes live.</p>
    </div>
  ) : (
    /* We use a conditional flex-col if staff mode is active to keep things from squishing */
    <form onSubmit={handleSubmit} className={`flex ${isStaffMode ? 'flex-col' : 'flex-col sm:flex-row'} gap-3`}>
      <input
        type="email"
        required
        value={email || ''}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address..."
        disabled={status === 'loading'}
        className="flex-grow pl-5 pr-4 py-4 border-4 border-transparent rounded-2xl focus:border-amber-300 outline-none text-slate-900 font-bold text-base shadow-inner transition-colors bg-white disabled:opacity-50"
      />
      
      {isStaffMode && (
        <input
          type="text"
          required
          value={library || ""}
          onChange={(e) => setLibrary(e.target.value)}
          placeholder="Which library do you work at?"
          className="flex-grow pl-5 pr-4 py-4 border-4 border-transparent rounded-2xl focus:border-amber-300 outline-none text-slate-900 font-bold text-base shadow-inner transition-colors bg-white disabled:opacity-50"
        />
      )}
      
      <button 
        type="submit"
        disabled={status === 'loading'}
        className="px-8 py-4 bg-amber-400 text-amber-950 font-extrabold text-base rounded-2xl border-b-4 border-amber-600 hover:bg-amber-300 hover:border-amber-500 active:border-b-0 active:translate-y-1 transition-all whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  )}

  <p className="text-teal-100 text-xs font-semibold mt-4 text-center">
    <span className="text-rose-600">No spam.</span> We promise. Just one email when we launch.
  </p>

  {/* Staff Mode Toggle Area */}
  <div className="mt-6 text-center">
    {!isStaffMode ? (
      <p className="text-teal-100 text-sm font-bold">
        Working at a library in the MHLS? 
        <button 
          onClick={() => setIsStaffMode(true)}
          className="ml-2 underline decoration-2 underline-offset-4 hover:text-white transition-colors"
        >
          Click here for the Staff Beta →
        </button>
      </p>
    ) : (
      <div className="bg-teal-600/60 p-4 rounded-2xl border-2 border-dashed border-teal-300 transition-all animate-in fade-in zoom-in duration-300">
        <p className="text-white text-sm font-black italic mb-2">
          STAFF MODE ACTIVATED
        </p>
        <p className="text-teal-50 text-xs font-bold mb-3">
          Sign up to help test our Director-level tools.
        </p>
        <button 
          onClick={() => setIsStaffMode(false)}
          className="text-teal-200 text-xs font-bold uppercase tracking-widest hover:text-white underline decoration-dotted"
        >
          ← Back to standard signup
        </button>
      </div>
    )}
  </div>
</div>
</div>
        {/* Value Props (Styled like EventCards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
          
          <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-[0_4px_0_rgb(241,245,249)] p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 -rotate-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h4 className="text-lg font-extrabold text-slate-800 mb-2">Smart Searching</h4>
            <p className="text-slate-600 text-sm font-medium">Filter by category, distance, or keyword across multiple library systems instantly.</p>
          </div>

          <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-[0_4px_0_rgb(241,245,249)] p-6 text-center">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            </div>
            <h4 className="text-lg font-extrabold text-slate-800 mb-2">Location Aware</h4>
            <p className="text-slate-600 text-sm font-medium">Use your location or zip code to always see the events happening closest to you.</p>
          </div>

          <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-[0_4px_0_rgb(241,245,249)] p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 -rotate-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="text-lg font-extrabold text-slate-800 mb-2">AI-Assisted Categorization</h4>
            <p className="text-slate-600 text-sm font-medium">Our system strategically uses small language models for accurate categorization, so "Family Night" means Family Night.</p>
          </div>

        </div>
        {/* About Section */}
<section id="about" className="max-w-4xl mx-auto mt-24 mb-20 px-4">
  <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 p-8 md:p-12 shadow-[0_8px_0_rgb(226,232,240)]">
    <div className="flex flex-col md:flex-row gap-10 items-center">
      {/* Placeholder for a photo or a cool illustration */}
      <div className="w-32 h-32 md:w-48 md:h-48 bg-rose-100 rounded-[2rem] border-4 border-rose-500 flex-shrink-0 rotate-3 overflow-hidden shadow-inner flex items-center justify-center">
         <span className="text-4xl">👋</span>
      </div>

      <div>
        <h3 className="text-3xl font-black text-slate-800 mb-4">Why I'm building Librova</h3>
        <p className="text-slate-600 font-medium leading-relaxed mb-4">
          Hi, I'm Veronica. I live in Northern Dutchess and, as a mom of four, I’ve spent years trying to keep track of library calendars across three different counties just to find a Saturday morning craft or a coding club.
        </p>
        <p className="text-slate-600 font-medium leading-relaxed mb-4">
          With a background in library leadership and technical writing, I realized that the problem isn't a lack of great programming—it's that the data is scattered. 
        </p>
        <p className="text-slate-600 font-medium leading-relaxed">
          I'm building Librova to make our incredible Mid-Hudson Library System more accessible to every family in the valley.
        </p>
      </div>
    </div>
  </div>
</section>
      </main>

<footer className="mt-auto py-12 border-t-2 border-amber-100 bg-white/30">
  <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
    <div className="text-center md:text-left">
      <p className="text-slate-800 font-black text-lg">Librova</p>
      <p className="text-slate-500 font-bold text-sm">Connecting the Hudson Valley to its libraries.</p>
    </div>

    <div className="flex flex-col items-center md:items-end gap-2">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Questions or Feedback?</p>
      <a 
        href="mailto:hello@librova.com" 
        className="text-teal-600 font-extrabold hover:text-rose-500 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        hello@librova.com
      </a>
    </div>
  </div>
  
  <div className="mt-8 text-center text-slate-400 font-bold text-xs">
    © {new Date().getFullYear()} Librova.
  </div>
</footer>
    </div>
    </PlausibleProvider>
  );
}