import React from 'react';
import { CATEGORY_MAP } from '@/lib/categoryConstants';

// Define the shape of your event JSON data
export interface LibraryEvent {
  id: string;
  title: string;
  libraryName: string;
  date: string; 
  time: string; 
  description: string;
  sourceUrl: string;
  category_ids?: number[]; 
  distance?: number | null;
  primary_category_id?: number | null;
}

interface EventCardProps {
  event: LibraryEvent;
  selectedCategories: number[]; 
  onLibraryClick: (name: string) => void;
  onCategoryClick: (id: number) => void;
}

export default function EventCard({ event, selectedCategories, onLibraryClick, onCategoryClick }: EventCardProps) {
  const categories = event.category_ids || [];
  const hasValidUrl = event.sourceUrl && event.sourceUrl !== "#";

  // 1. Check if the primary focus is a Movie
  const isMovie = event.primary_category_id === 21;

  // 2. Mask the title if true
  const displayedTitle = isMovie 
    ? "🎬 Movie Showing" 
    : event.title;

  // 3. Append the legal disclaimer if true
  const displayedDescription = isMovie 
    ? `🎥 Due to potential licensing agreements, we are not showing the movie title here—click to see what's playing!)`
    : event.description;

  return (
    <div className="bg-white rounded-4xl border-4 border-librova-light shadow-[0_4px_0_rgb(224,224,224)] hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(224,224,224)] hover:border-librova-pink/20 transition-all flex flex-col h-full overflow-hidden text-left group">
      
      {/* Category bar */}
      {categories.length > 0 && (
        <div className="px-6 pt-5 pb-2 flex flex-wrap gap-2">
          {categories.map((id, index) => {
            const label = CATEGORY_MAP[id];
            if (!label) return null;

            const isActive = selectedCategories.includes(id);

            return (
              <button 
                key={id} 
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryClick(id);
                }}
                className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-lg border-2 shadow-sm transition-all active:scale-95 ${
                  isActive 
                  // ACTIVE: Bright, punchy pink to immediately show selection
                  ? 'bg-librova-pink text-white border-librova-pink shadow-inner' 
                  // INACTIVE: Subtle styling, but hovers to a warm pink glow
                  : 'bg-librova-light text-librova-dark/70 border-librova-border hover:bg-librova-pink/10 hover:text-librova-pink hover:border-librova-pink/30' 
                } ${
                  index % 2 === 0 ? 'rotate-1 group-hover:rotate-3' : '-rotate-1 group-hover:-rotate-3'
                }`}  
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="p-6 grow flex flex-col pt-2"> 
        
        {/* Date & Time */}
        <div className="flex items-center text-librova-teal font-bold text-sm mb-3">
          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{event.date} • {event.time}</span>
        </div>

        {/* Title & Clickable Library Name */}
        <h4 className="text-xl font-extrabold text-librova-dark mb-1 leading-tight group-hover:text-librova-pink transition-colors">
          {displayedTitle}
        </h4>
        
        <div className="flex items-center text-librova-dark/60 font-semibold text-sm mb-4">
          <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLibraryClick(event.libraryName);
            }}
            className="text-left hover:text-librova-teal hover:underline transition-colors truncate"          >
            {event.libraryName}
            {event.distance !== undefined && event.distance !== null && (
              <span className="ml-1 text-librova-teal font-bold">({event.distance} mi)</span>
            )}
          </button>
        </div>

        {/* Description Snippet */}
        <p className="text-librova-dark/80 font-medium text-sm line-clamp-3 mb-6 flex-grow whitespace-pre-line">
          {displayedDescription} 
        </p>

        {/* Action Button */}
        <a 
          href={hasValidUrl ? event.sourceUrl : "#"} 
          className={`mt-auto block text-center px-6 py-3 font-extrabold text-sm rounded-xl border-b-4 transition-all ${
            hasValidUrl 
            ? "bg-librova-pink text-white border-librova-red hover:opacity-90 active:border-b-0 active:translate-y-1 shadow-sm" 
            : "bg-librova-light text-librova-dark/40 border-librova-border cursor-not-allowed"
          }`}
        >
          {isMovie ? "See What's Playing" : (hasValidUrl ? "More Info" : "No Link Available")}
        </a>
      </div>
    </div>
  );
}