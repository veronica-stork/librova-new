"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LibraryEvent } from '../../components/EventCard';
import EventFeed from '../../components/EventFeed';
import Hero from '@/components/Hero';
import { Library, LibraryDirectory } from '../../components/LibraryDirectory';
import { Suspense } from 'react';
import PlausibleProvider from 'next-plausible';


function LibrovaHomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Core Data State
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [allLibraries, setAllLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 👇 NEW: Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Separates initial load spinner from the button spinner
  
  // View Toggle State
  const [currentView, setCurrentView] = useState<'feed' | 'directory'>('feed');

  // Extract URL Parameters to drive the API call
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const urlQ = searchParams.get('q');
  const urlLocationQuery = searchParams.get('location');
  const urlRadius = searchParams.get('radius') || '15';
  const urlSort = searchParams.get('sort') || 'time';
  const urlDate = searchParams.get('date') || 'today';
  
  const urlCategories = searchParams.get('categories') || '';
  const urlLibrary = searchParams.get('library') || '';

  // 👇 UPDATED: Added targetPage and isLoadMore parameters
  const fetchEvents = async (targetPage = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setPage(1); // Reset page tracking if this is a fresh search!
    }

    try {
      const params = new URLSearchParams();
      
      // 1. Coordinates (if geocoded by SearchControls)
      if (urlLat && urlLng) {
        params.append('lat', urlLat);
        params.append('lng', urlLng);
        params.append('radius', urlRadius);
      }
      
      // 2. Keyword Search & Filters
      if (urlQ) params.append('q', urlQ);
      if (urlCategories) params.append('categories', urlCategories);
      if (urlLibrary) params.append('library', urlLibrary);

      // 3. Date, Sort, Time
      params.append('date', urlDate);
      params.append('sort', urlSort);

      const now = new Date();
      const clientTime = now.toLocaleTimeString('en-US', { hour12: false });
      params.append('clientTime', clientTime);

      // 👇 NEW: Send the page number to the API
      params.append('page', targetPage.toString());

      const queryString = params.toString();
      const endpoint = `/api/events/nearby${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();

      // If we asked for today, but got nothing back on a fresh search, auto-forward to tomorrow!
      if (data.length === 0 && urlDate === 'today' && !isLoadMore) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('date', 'tomorrow');
        router.replace(`${pathname}?${params.toString()}`);
        return; 
      }

      // 👇 NEW: Check if we hit the end of the results (assuming 100 is your limit)
      if (data.length < 100) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // 👇 NEW: Append or Replace logic
      if (isLoadMore) {
        setEvents((prev) => [...prev, ...data]); // Glue new events to the bottom
        setPage(targetPage); // Officially update the page state
      } else {
        setEvents(data); // Wipe and replace for a fresh search
      }

    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchLibraries = async () => {
    try {
      const response = await fetch('/api/libraries');
      if (!response.ok) throw new Error('Failed to fetch libraries');
      const data = await response.json();
      setAllLibraries(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Trigger fetch when URL parameters change (This handles fresh searches)
  useEffect(() => {
    fetchEvents(1, false); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLat, urlLng, urlQ, urlLocationQuery, urlRadius, urlSort, urlDate, urlLibrary, urlCategories]);

  // Fetch libraries once on mount
  useEffect(() => {
    fetchLibraries();
  }, []);

  const handleReset = () => {
    setCurrentView('feed');
    window.location.href = '/search'; 
  };

  const handleLibraryClick = (libraryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('library', libraryName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearLibrary = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('library');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCategoryClick = (categoryId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCats = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    
    let newCats;
    if (currentCats.includes(categoryId.toString())) {
      newCats = currentCats.filter(id => id !== categoryId.toString());
    } else {
      newCats = [...currentCats, categoryId.toString()];
    }

    if (newCats.length > 0) {
      params.set('categories', newCats.join(','));
    } else {
      params.delete('categories');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 👇 NEW: The function that runs when the user clicks "Load More"
  const handleLoadMore = () => {
    const nextPage = page + 1;
    fetchEvents(nextPage, true);
  };

  return (
    <PlausibleProvider src="https://plausible.io/js/pa-sg4BID33_L_D4oA_Whr8M.js">
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-rose-200">
      
      {/* Navigation Bar (Unchanged) */}
      <nav className="bg-white border-b-4 border-rose-100 sticky top-0 z-50">
       {/* ... keeping your existing nav code ... */}
      </nav>

      {/* Main Content Area */}
      <main className="w-full pb-20">
        {currentView === 'feed' ? (
          <>
            <Hero />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              {/* Only show the full-page spinner on a FRESH search (page 1) */}
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                </div>
              ) : (
                <EventFeed 
                  events={events}
                  selectedLibrary={urlLibrary || null} 
                  selectedCategories={searchParams.get('categories')?.split(',').map(Number).filter(Boolean) || []} 
                  onClearLibrary={handleClearLibrary}
                  onLibraryClick={handleLibraryClick}
                  onCategoryClick={handleCategoryClick}
                  // 👇 PASSING THE NEW PAGINATION PROPS
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  isLoading={isLoadingMore}
                />
              )}
            </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <LibraryDirectory libraries={allLibraries} /> 
          </div>
        )}
      </main>
    </div>
    </PlausibleProvider>
  );
}

export default function LibrovaHome() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    }>
      <LibrovaHomeContent />
    </Suspense>
  );
}