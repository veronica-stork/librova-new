import React from 'react';

// Define the shape of your event JSON data
export interface LibraryEvent {
  id: string;
  title: string;
  libraryName: string;
  date: string;
  time: string;
  description: string;
  sourceUrl: string;
  category: string;
}

export default function EventCard({ event }: { event: LibraryEvent }) {
  return (
    <div className="bg-white rounded-[2rem] border-4 border-slate-100 shadow-[0_4px_0_rgb(241,245,249)] hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(241,245,249)] transition-all flex flex-col h-full overflow-hidden text-left relative group">
      
      {/* Category Badge */}
      <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full border-2 border-amber-200 z-10 rotate-3 group-hover:rotate-6 transition-transform">
        {event.category}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        {/* Date & Time */}
        <div className="flex items-center text-teal-600 font-bold text-sm mb-3 mt-4">
          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{event.date} • {event.time}</span>
        </div>

        {/* Title & Library Name */}
        <h4 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight">
          {event.title}
        </h4>
        <div className="flex items-center text-slate-500 font-semibold text-sm mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.libraryName}
        </div>

        {/* Description Snippet */}
        <p className="text-slate-600 font-medium text-sm line-clamp-3 mb-6 flex-grow">
          {event.description}
        </p>

        {/* Action Button */}
        <a 
          href={event.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-auto block text-center px-6 py-3 bg-rose-500 text-white font-extrabold text-sm rounded-xl border-b-4 border-rose-700 hover:bg-rose-400 hover:border-rose-600 active:border-b-0 active:translate-y-1 transition-all"
        >
          More Info
        </a>
      </div>
    </div>
  );
}