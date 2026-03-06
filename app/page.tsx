"use client";

import { useState, useEffect } from 'react';
import EventCard, { LibraryEvent } from '../components/EventCard'

const CATEGORIES = [
  { id: 1, name: 'Storytime' },
  { id: 2, name: 'Crafts' },
  { id: 3, name: 'Book talks' },
  { id: 4, name: 'Games' },
  { id: 5, name: 'History' },
  { id: 6, name: 'Health' },
  { id: 7, name: 'STEM' },
  { id: 8, name: 'Teens' },
  { id: 9, name: 'Adults' },
  { id: 10, name: 'Family' },
  { id: 11, name: 'Children' },
  { id: 12, name: 'Early Childhood'},
  { id: 13, name: 'Tech Help'},
  { id: 14, name: 'Special Needs'},
  { id: 15, name: 'ESL/Language'},
  { id: 16, name: 'Music'},
  { id: 17, name: 'Money'}
];

const QUICK_FILTER_IDS = [9, 10, 8, 12]; 

export default function LibrovaHome() {
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radius, setRadius] = useState(15);
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);

  // Updated to accept currentRadius to bypass React's async state batching
  const fetchEvents = async (
    lat?: number | null, 
    lng?: number | null, 
    cats: number[] = selectedCategories,
    currentRadius: number = radius,
    libName: string | null = selectedLibrary 
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (lat && lng) {
        params.append('lat', lat.toString());
        params.append('lng', lng.toString());
        params.append('radius', currentRadius.toString());
      }
      
      if (cats.length > 0) {
        params.append('categories', cats.join(','));
      }

      if (libName) {
        params.append('library', libName)
      }

      const queryString = params.toString();
      const endpoint = `/api/events/nearby${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.text(); 
        console.error(`Backend failed with status ${response.status}:`, errorData);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setEvents(data); 
    } catch (error) {
      console.error("Failed to fetch events:", error);
      alert("Failed to load events. Check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fires when radius dropdown changes
  const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);
    
    // Only fetch if we already have the user's location to filter around
    if (userLocation?.lat && userLocation?.lng) {
      fetchEvents(userLocation.lat, userLocation.lng, selectedCategories, newRadius);
    }
  };

  const handleLibraryClick = (name: string) => {
    setSelectedLibrary(name);
    fetchEvents(userLocation?.lat, userLocation?.lng, selectedCategories, radius, name);
  };

  // Function to reset location
  const resetLocation = () => {
  setUserLocation(null);
  // Fetch with null lat/lng to get the global feed
  fetchEvents(null, null, selectedCategories);
};

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
  const query = searchQuery.trim();
  if (!query) return;

  setIsLoading(true);

  try {
    let geoUrl = "";

    // Check if the input is a standard 5-digit US ZIP code
    if (/^\d{5}$/.test(query)) {
      geoUrl = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${query}&countrycodes=us&limit=1`;
    } else {
      geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=1`;
    }

    console.log("Fetching coordinates from:", geoUrl);

    const response = await fetch(geoUrl);
    const data = await response.json();

    console.log("Geocoding API response:", data);

    if (data && data.length > 0) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);

      console.log(`Success! Updating map to Lat: ${latitude}, Lng: ${longitude}`);

      // Update state and fetch events
      setUserLocation({ lat: latitude, lng: longitude });
      
      // Note: We pass selectedCategories and radius directly from state here
      fetchEvents(latitude, longitude, selectedCategories, radius);
      
    } else {
      alert(`Could not find a location for "${query}". Try adding the state, like "${query}, NY".`);
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    alert("Error connecting to the location search service.");
  } finally {
    setIsLoading(false);
  }
};

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchEvents(latitude, longitude); 
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("We need your location to find nearby libraries!");
      }
    );
  };

  const toggleCategory = (categoryId: number) => {
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
      
    setSelectedCategories(updatedCategories);
    fetchEvents(userLocation?.lat, userLocation?.lng, updatedCategories);
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-800 font-sans selection:bg-rose-200">
      {/* Navigation Bar */}
      <nav className="bg-white border-b-4 border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500 rounded-2xl rotate-3 flex items-center justify-center shadow-sm">
                <span className="text-white font-extrabold text-2xl -rotate-3">L</span>
              </div>
              <h1 className="text-3xl font-extrabold text-teal-900 tracking-tight">Librova</h1>
            </div>
            <div className="flex items-center space-x-8">
              <span className="text-base font-bold text-teal-700 hover:text-rose-500 cursor-pointer transition-colors hidden sm:block">Explore</span>
              <span className="text-base font-bold text-teal-700 hover:text-rose-500 cursor-pointer transition-colors hidden sm:block">Libraries</span>
              <div className="sm:hidden cursor-pointer text-teal-700 bg-teal-100 p-2 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section className="bg-teal-500 rounded-[2rem] shadow-[0_8px_0_rgb(15,118,110)] border-4 border-teal-700 p-8 md:p-12 mb-14 relative overflow-visible">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-400 rounded-full opacity-50 blur-2xl pointer-events-none"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 text-center drop-shadow-sm">
              Find Library Events Near You
            </h2>
            <p className="text-center text-teal-100 font-medium text-lg mb-10">
              Discover programs, workshops, and activities happening in your local network.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
  <div className="w-full relative flex-grow max-w-lg group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <svg className="h-6 w-6 text-slate-400 group-focus-within:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      placeholder="Zip code, city, or keyword..."
      className="w-full h-full pl-12 pr-16 py-4 border-4 border-transparent rounded-2xl focus:border-amber-300 outline-none text-slate-900 font-medium text-lg shadow-inner transition-colors bg-white"
    />
    {/* The Internal Search Button */}
    <button 
      onClick={handleSearch}
      className="absolute right-3 top-3 bottom-3 px-4 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors flex items-center justify-center"
      title="Search"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  </div>
  
  <button 
    onClick={handleLocationClick}
    disabled={isLoading}
    className="flex items-center justify-center px-8 py-4 bg-amber-400 text-amber-950 font-bold text-lg rounded-2xl border-b-4 border-amber-600 hover:bg-amber-300 hover:border-amber-500 active:border-b-0 active:translate-y-1 transition-all whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
  >
    {isLoading ? (
      <span>Finding Libraries...</span>
    ) : (
      <>
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Use My Location
      </>
    )}
  </button>
</div>

            {/* Filters Section */}
            <div className="mt-10 pt-6 border-t-2 border-teal-400">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                
                <div className="flex items-center space-x-3 w-full lg:w-auto bg-teal-600 p-2 rounded-xl shrink-0">
                  <label className="text-sm font-bold text-teal-50 whitespace-nowrap px-2">Radius:</label>
                  {/* WIRED UP THE SELECT TAG HERE */}
                  <select 
                    value={radius}
                    onChange={handleRadiusChange}
                    className="bg-white border-2 border-teal-700 text-slate-800 text-sm font-bold rounded-lg focus:ring-0 outline-none block py-2 px-3 cursor-pointer"
                  >
                    <option value="10">Within 10 miles</option>
                    <option value="15">Within 15 miles</option>
                    <option value="25">Within 25 miles</option>
                  </select>
                </div>

                {/* Categories Wrapper */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                  
                  {/* Quick Filters */}
                  <div className="hidden lg:flex items-center gap-2">
                    {QUICK_FILTER_IDS.map((id) => {
                      const category = CATEGORIES.find(c => c.id === id);
                      if (!category) return null;
                      
                      const isActive = selectedCategories.includes(id);
                      
                      return (
                        <button
                          key={`quick-${id}`}
                          onClick={() => toggleCategory(id)}
                          className={`px-4 py-2 rounded-xl font-bold text-sm border-b-4 transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-rose-500 border-rose-700 text-white active:border-b-0 active:translate-y-1' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:border-b-0 active:translate-y-1'
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dropdown for All Categories */}
                  <div className="relative w-full lg:w-auto">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full lg:w-auto flex justify-between items-center px-5 py-3 bg-white border-2 border-teal-700 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span>
                        More Categories {selectedCategories.length > 0 && <span className="ml-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs">{selectedCategories.length}</span>}
                      </span>
                      <svg className={`w-5 h-5 ml-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full lg:w-56 right-0 bg-white border-2 border-teal-700 rounded-xl shadow-xl overflow-hidden">
                        <div className="max-h-60 overflow-y-auto p-2">
                          {CATEGORIES.map((category) => (
                            <label key={category.id} className="flex items-center p-2 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category.id)}
                                onChange={() => toggleCategory(category.id)}
                                className="w-5 h-5 text-rose-500 border-2 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                              />
                              <span className="ml-3 text-sm font-semibold text-slate-700">{category.name}</span>
                            </label>
                          ))}
                        </div>
                        {selectedCategories.length > 0 && (
                          <div className="p-2 border-t border-slate-100 bg-slate-50">
                            <button 
                              onClick={() => {
                                setSelectedCategories([]);
                                if (userLocation) fetchEvents(userLocation.lat, userLocation.lng, []);
                              }}
                              className="w-full text-sm font-bold text-rose-600 hover:text-rose-700 py-1"
                            >
                              Clear All
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-6 px-2">
            <h3 className="text-2xl font-extrabold text-teal-900">Upcoming Events</h3>
            {selectedLibrary && (
  <div className="flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold text-sm">
    Filtering: {selectedLibrary}
    <button onClick={() => {
      setSelectedLibrary(null);
      fetchEvents(userLocation?.lat, userLocation?.lng, selectedCategories, radius, null);
    }}>
      ✕
    </button>
  </div>
)}
            <span className="text-sm font-bold text-teal-600 bg-teal-100 px-3 py-1 rounded-full">
              {events.length} results
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                selectedCategories={selectedCategories}
                onLibraryClick={() => handleLibraryClick(event.libraryName)}
                onCategoryClick={(id) => toggleCategory(id)}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}