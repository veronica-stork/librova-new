"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LibraryEvent } from '../components/EventCard';
import EventFeed from '../components/EventFeed';
import Hero from '@/components/Hero';
import { Library, LibraryDirectory } from '../components/LibraryDirectory';
import { Suspense } from 'react';

function LibrovaHomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Core Data State
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [allLibraries, setAllLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false); 
  
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

  const fetchEvents = async (targetPage = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setPage(1); 
    }

    try {
      const params = new URLSearchParams();
      
      if (urlLat && urlLng) {
        params.append('lat', urlLat);
        params.append('lng', urlLng);
        params.append('radius', urlRadius);
      }
      
      if (urlQ) params.append('q', urlQ);
      if (urlCategories) params.append('categories', urlCategories);
      if (urlLibrary) params.append('library', urlLibrary);

      params.append('date', urlDate);
      params.append('sort', urlSort);

      const now = new Date();
      const clientTime = now.toLocaleTimeString('en-US', { hour12: false });
      params.append('clientTime', clientTime);

      params.append('page', targetPage.toString());

      const queryString = params.toString();
      const endpoint = `/api/events/nearby${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.length === 0 && urlDate === 'today' && !isLoadMore) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('date', 'tomorrow');
        router.replace(`${pathname}?${params.toString()}`);
        return; 
      }

      if (data.length < 100) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isLoadMore) {
        setEvents((prev) => [...prev, ...data]); 
        setPage(targetPage); 
      } else {
        setEvents(data); 
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

  useEffect(() => {
    fetchEvents(1, false); 
  }, [urlLat, urlLng, urlQ, urlLocationQuery, urlRadius, urlSort, urlDate, urlLibrary, urlCategories]);

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

  const handleLoadMore = () => {
    const nextPage = page + 1;
    fetchEvents(nextPage, true);
  };

  return (
    // Replaced bg-slate-50 and text-slate-800 with your brand colors!
    <div className="min-h-screen bg-librova-light text-librova-dark font-sans selection:bg-librova-teal/20">
      {/* Updated the top border to use your brand border color */}
      <nav className="bg-white border-b border-librova-border sticky top-0 z-50">
      </nav>

      {/* Main Content Area */}
      <main className="w-full pb-20">
        {currentView === 'feed' ? (
          <>
            <Hero />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  {/* Updated the loading spinner to use your primary Teal! */}
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-librova-teal"></div>
                </div>
              ) : (
                <EventFeed 
                  events={events}
                  selectedLibrary={urlLibrary || null} 
                  selectedCategories={searchParams.get('categories')?.split(',').map(Number).filter(Boolean) || []} 
                  onClearLibrary={handleClearLibrary}
                  onLibraryClick={handleLibraryClick}
                  onCategoryClick={handleCategoryClick}
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
  );
}

export default function LibrovaHome() {
  return (
    // Updated Suspense fallback wrapper colors to match
    <Suspense fallback={
      <div className="min-h-screen bg-librova-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-librova-teal"></div>
      </div>
    }>
      <LibrovaHomeContent />
    </Suspense>
  );
}