import React from 'react';

// 1. Map the database IDs back to UI labels
export const CATEGORY_MAP: Record<number, string> = {
  1: "Storytime", 2: "Crafts", 3: "Book Talks", 4: "Games", 
  5: "History", 6: "Health", 7: "STEM", 8: "Teens", 
  9: "Adults", 10: "Family", 11: "Children", 
  12: "Early Childhood", 13: "Tech Help", 14: "Special Needs", 15: "Languages", 
  16: "Music", 17: "Money"
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

export default function EventCard({ event }: { event: LibraryEvent }) {
  
  // Logic to handle "All Day" events based on the 00:00:00 timestamp convention
const formatDisplayTime = (dateStr: string, timeStr: string) => {
  // 1. Immediate "All Day" check - the most reliable way!
  // If the string starts with 00:00, it's an All Day event from our scraper.
  if (timeStr && timeStr.startsWith("00:00")) {
    return "All Day";
  }

  try {
    // 2. If it's not All Day, let's try to format the time string safely.
    // If timeStr is "14:30:00", we want to turn it into a Date just to format it.
    // We use a dummy date because we only care about the time.
    const [hours, minutes] = timeStr.split(':');
    const dummyDate = new Date();
    dummyDate.setHours(parseInt(hours), parseInt(minutes));

    if (isNaN(dummyDate.getTime())) return "Time TBA";

    return dummyDate.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  } catch (e) {
    console.error("Formatting error:", e);
    return "Time TBA";
  }
};

  const categories = event.category_ids || [];
  const hasValidUrl = event.sourceUrl && event.sourceUrl !== "#";

  return (
    <div className="bg-white rounded-4xl border-4 border-slate-100 shadow-[0_4px_0_rgb(241,245,249)] hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(241,245,249)] transition-all flex flex-col h-full overflow-hidden text-left relative group">
      
      {/* Category Badges */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
        {categories.map((id, index) => {
          const label = CATEGORY_MAP[id];
          if (!label) return null;
          
          return (
            <div 
              key={id} 
              className={`bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full border-2 border-amber-200 shadow-sm transition-transform ${index % 2 === 0 ? 'rotate-2 group-hover:rotate-6' : '-rotate-2 group-hover:-rotate-6'}`}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="p-6 grow flex flex-col">
        {/* Date & Time - Using the new helper */}
        <div className="flex items-center text-teal-600 font-bold text-sm mb-3 mt-4">
          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {/* We assume event.date is pre-formatted or handled by the parent, 
              but we transform the time here */}
          <span>{event.date} • {formatDisplayTime(event.date, event.time)}</span>
        </div>

        {/* Title & Library Name */}
        <h4 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight">
          {event.title}
        </h4>
        <div className="flex items-center text-slate-500 font-semibold text-sm mb-4">
          <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {event.libraryName}
            {event.distance !== undefined && event.distance !== null && (
              <span className="ml-1 text-teal-600 font-bold">({event.distance} mi)</span>
            )}
          </span>
        </div>

        {/* Description Snippet */}
        <p className="text-slate-600 font-medium text-sm line-clamp-3 mb-6 flex-grow">
          {event.description}
        </p>

        {/* Action Button */}
        {hasValidUrl ? (
          <a 
            href={event.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-auto block text-center px-6 py-3 bg-rose-500 text-white font-extrabold text-sm rounded-xl border-b-4 border-rose-700 hover:bg-rose-400 hover:border-rose-600 active:border-b-0 active:translate-y-1 transition-all"
          >
            More Info
          </a>
        ) : (
          <div 
            className="mt-auto block text-center px-6 py-3 bg-slate-200 text-slate-400 font-extrabold text-sm rounded-xl border-b-4 border-slate-300 cursor-not-allowed"
            title="Registration link not provided"
          >
            No Link Available
          </div>
        )}
      </div>
    </div>
  );
}