"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LibraryEvent } from '../../components/EventCard';
import EventFeed from '../../components/EventFeed';
import Hero from '@/components/Hero';
import { Library, LibraryDirectory } from '../../components/LibraryDirectory';
import { Suspense } from 'react';

function LibrovaHomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Core Data State
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [allLibraries, setAllLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // 1. Coordinates (if geocoded by SearchControls)
      if (urlLat && urlLng) {
        params.append('lat', urlLat);
        params.append('lng', urlLng);
        params.append('radius', urlRadius);
      }
      
      // 2. Keyword Search
      if (urlQ) {
        params.append('q', urlQ);
      }

      if (urlCategories) {
        params.append('categories', urlCategories);
      }

      if (urlLibrary) {
        params.append('library', urlLibrary);
      }

      // 3. Date Filter
      params.append('date', urlDate);

      // 4. Sort Order
      params.append('sort', urlSort);

      // 5. Client Time (To filter out events that already ended today)
      const now = new Date();
      const clientTime = now.toLocaleTimeString('en-US', { hour12: false });
      params.append('clientTime', clientTime);

      const queryString = params.toString();
      const endpoint = `/api/events/nearby${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      // If we asked for today, but got nothing back, auto-forward to tomorrow!
      if (data.length === 0 && urlDate === 'today') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('date', 'tomorrow');
        
        // This silently updates the URL, which automatically triggers 
        // the useEffect to run fetchEvents() again!
        router.replace(`${pathname}?${params.toString()}`);
        return; 
      }
      setEvents(data); 
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
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

  // Trigger fetch when URL parameters change
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLat, urlLng, urlQ, urlLocationQuery, urlRadius, urlSort, urlDate, urlLibrary, urlCategories]);

  // Fetch libraries once on mount
  useEffect(() => {
    fetchLibraries();
  }, []);

  // For the navbar reset button
  const handleReset = () => {
    setCurrentView('feed');
    // The easiest way to reset is just push the user back to the clean root URL
    window.location.href = '/search'; 
  };

  const handleLibraryClick = (libraryName: string) => {
  const params = new URLSearchParams(searchParams.toString());
  
  // Update the 'library' parameter
  params.set('library', libraryName);
  
  // Update the URL. We use { scroll: false } to prevent the page 
  // from jumping to the top if they click a library at the bottom of the feed.
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
    // Remove if already there
    newCats = currentCats.filter(id => id !== categoryId.toString());
  } else {
    // Add if not there
    newCats = [...currentCats, categoryId.toString()];
  }

  if (newCats.length > 0) {
    params.set('categories', newCats.join(','));
  } else {
    params.delete('categories');
  }

  // scroll: false prevents the page from jumping to the top when you click a tag
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-rose-200">
      
      {/* Navigation Bar */}
      <nav className="bg-white border-b-4 border-rose-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo area */}
            <div 
              className="flex-shrink-0 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={handleReset}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
              aria-label="Reset filters and go home"
            >
              <div className="w-10 h-10 bg-rose-600 rounded-2xl rotate-3 flex items-center justify-center shadow-sm">
                <span className="text-white font-extrabold text-2xl -rotate-3">L</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Librova</h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              <nav className="flex gap-6">
                <button 
                  onClick={() => setCurrentView('feed')}
                  className={`font-bold text-lg transition-colors ${currentView === 'feed' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Explore
                </button>
                <button 
                  onClick={() => setCurrentView('directory')}
                  className={`font-bold text-lg transition-colors ${currentView === 'directory' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Libraries
                </button>
              </nav>              
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-full pb-20">
        {currentView === 'feed' ? (
          <>
            {/* 1. The Integrated Hero & Search Component */}
            <Hero />

            {/* 2. The Event Feed */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                </div>
              ) : (
                <EventFeed 
                  events={events}
                  // These props might need updating depending on how you want 
                  // to handle category clicks now that state is in the URL
                  selectedLibrary={null} 
                  selectedCategories={searchParams.get('categories')?.split(',').map(Number).filter(Boolean) || []} 
                  onClearLibrary={() => {}}
                  onLibraryClick={handleLibraryClick}
                  onCategoryClick={handleCategoryClick}
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