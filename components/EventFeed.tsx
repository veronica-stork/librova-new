import React from 'react';
import EventCard, { LibraryEvent } from './EventCard';

interface EventFeedProps {
  events: LibraryEvent[];
  selectedLibrary: string | null;
  selectedCategories: number[];
  onClearLibrary: () => void;
  onLibraryClick: (libraryName: string) => void;
  onCategoryClick: (categoryId: number) => void;
  
  // New Pagination Props
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export default function EventFeed({
  events,
  selectedLibrary,
  selectedCategories,
  onClearLibrary,
  onLibraryClick,
  onCategoryClick,
  onLoadMore,
  hasMore,
  isLoading
}: EventFeedProps) {
  
  // Empty State Handling
  if (events.length === 0) {
    return (
      <section className="text-center py-16 px-4 bg-white rounded-3xl border-4 border-slate-100 shadow-sm">
        <h3 className="text-2xl font-extrabold text-teal-900 mb-2">No Events Found</h3>
        <p className="text-slate-500 font-medium">
          Try adjusting your filters, expanding your search radius, or clearing the selected categories.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap justify-between items-end mb-6 px-2 gap-4">
        <h3 className="text-2xl font-extrabold text-teal-900">Upcoming Events</h3>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Library Filter Badge */}
          {selectedLibrary && (
            <div className="flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full font-bold text-sm border border-rose-200 shadow-sm">
              Filtering: {selectedLibrary}
              <button 
                onClick={onClearLibrary}
                className="hover:text-rose-900 hover:bg-rose-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                aria-label="Clear library filter"
              >
                ✕
              </button>
            </div>
          )}
          
          {/* Result Count */}
          <span className="text-sm font-bold text-teal-700 bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-full shadow-sm">
            {events.length} results
          </span>
        </div>
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            selectedCategories={selectedCategories}
            onLibraryClick={() => onLibraryClick(event.libraryName)}
            onCategoryClick={(id) => onCategoryClick(id)}
          />
        ))}
      </div>

      {/* Pagination UI - The "Load More" Button */}
      <div className="mt-12 flex flex-col items-center justify-center">
        {hasMore ? (
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-8 py-3 bg-teal-50 text-teal-800 font-extrabold rounded-full border-2 border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : "Load More Events"}
          </button>
        ) : (
          <p className="text-slate-400 font-medium bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
            You've reached the end of the results.
          </p>
        )}
      </div>
    </section>
  );
}