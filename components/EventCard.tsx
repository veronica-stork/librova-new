import React from 'react';

// 1. Map the database IDs back to UI labels
export const CATEGORY_MAP: Record<number, string> = {
  1: "Storytime", 2: "Crafts", 3: "Book Talks", 4: "Games", 
  5: "History", 6: "Health", 7: "STEM", 8: "Teens", 
  9: "Adults", 10: "Family", 11: "Children", 
  12: "Early Childhood", 13: "Tech Help", 14: "Special Needs", 15: "Languages", 
  16: "Music", 17: "Money", 18: "Gardening", 19: "Cooking", 20: "Literacy"
};

// Define the shape of your event JSON data
export interface LibraryEvent {
  id: string;
  title: string;
  libraryName: string;
  date: string; // e.g., "2026-02-27"
  time: string; // e.g., "14:30:00" or "00:00:00"
  description: string;
  sourceUrl: string;
  category_ids?: number[]; 
  distance?: number | null;
}

export default function EventCard({ event, onLibraryClick }: { event: LibraryEvent, onLibraryClick?: () => void }) {
  const categories = event.category_ids || [];
  const hasValidUrl = event.sourceUrl && event.sourceUrl !== "#";

  return (
    <div className="bg-white rounded-4xl border-4 border-slate-100 shadow-[0_4px_0_rgb(241,245,249)] hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(241,245,249)] transition-all flex flex-col h-full overflow-hidden text-left group">
      
      {/* 1. New Category Bar at the Very Top */}
      {categories.length > 0 && (
        <div className="px-6 pt-5 pb-2 flex flex-wrap gap-2">
          {categories.map((id, index) => {
            const label = CATEGORY_MAP[id];
            if (!label) return null;
            return (
              <div 
                key={id} 
                className={`bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-lg border-2 border-amber-200 shadow-sm transition-transform ${
                  index % 2 === 0 ? 'rotate-1 group-hover:rotate-3' : '-rotate-1 group-hover:-rotate-3'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}

      <div className="p-6 grow flex flex-col pt-2"> {/* Reduced top padding here */}
        
        {/* Date & Time */}
        <div className="flex items-center text-teal-600 font-bold text-sm mb-3">
          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{event.date} • {event.time}</span>
        </div>

        {/* Title & Clickable Library Name */}
        <h4 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight">
          {event.title}
        </h4>
        
        <div className="flex items-center text-slate-500 font-semibold text-sm mb-4">
          <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {/* Added the onClick we discussed earlier! */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (onLibraryClick) onLibraryClick();
            }}
            className="text-left hover:text-rose-500 hover:underline transition-colors truncate"          >
            {event.libraryName}
            {event.distance !== undefined && event.distance !== null && (
              <span className="ml-1 text-teal-600 font-bold">({event.distance} mi)</span>
            )}
          </button>
        </div>

        {/* Description Snippet */}
        <p className="text-slate-600 font-medium text-sm line-clamp-3 mb-6 flex-grow">
          {event.description}
        </p>

        {/* Action Button (Simplified for this snippet) */}
        <a 
          href={hasValidUrl ? event.sourceUrl : "#"} 
          className={`mt-auto block text-center px-6 py-3 font-extrabold text-sm rounded-xl border-b-4 transition-all ${
            hasValidUrl 
            ? "bg-rose-500 text-white border-rose-700 hover:bg-rose-400 active:border-b-0 active:translate-y-1" 
            : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
          }`}
        >
          {hasValidUrl ? "More Info" : "No Link Available"}
        </a>
      </div>
    </div>
  );
}