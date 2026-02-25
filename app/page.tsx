"use client";

import { useState } from 'react';
import EventCard, { LibraryEvent } from '../components/EventCard'

// The complete, updated taxonomy
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
  { id: 15, name: 'ESL/Language'}
];

// IDs for the buttons we want exposed on wider screens
const QUICK_FILTER_IDS = [9, 10, 8, 12]; 

export default function LibrovaHome() {
  const initialEvents: LibraryEvent[] = [
    {
      id: "evt_001",
      title: "Junior Miners: Minecraft Free Play",
      libraryName: "Tivoli Free Library",
      date: "Feb 28, 2026",
      time: "3:30 PM",
      description: "Calling all Kindergarteners and early elementary builders! Join us for an afternoon of creative mode block-building. Laptops provided, or bring your own device. Space is limited so grab a spot!",
      sourceUrl: "#",
      category_ids: [11, 7]
    },
    {
      id: "evt_002",
      title: "Teen Robotics Workshop",
      libraryName: "Red Hook Public Library",
      date: "Mar 2, 2026",
      time: "4:00 PM",
      description: "Learn to build and program simple robots using Arduino kits. No prior coding experience required. All materials are provided by the library.",
      sourceUrl: "#",
      category_ids: [8,7]
    },
    {
      id: "evt_003",
      title: "Adult Fiction Book Club",
      libraryName: "Starr Library",
      date: "Mar 5, 2026",
      time: "6:30 PM",
      description: "This month we are discussing 'The Midnight Library' by Matt Haig. Coffee, tea, and light refreshments will be served in the community room.",
      sourceUrl: "#",
      category_ids: [9, 3]
    }
  ];

  const [events, setEvents] = useState<LibraryEvent[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const fetchNearbyEvents = async (lat: number, lng: number, cats: number[] = selectedCategories) => {
    setIsLoading(true);
    try {
      const categoryQuery = cats.length > 0 ? `&categories=${cats.join(',')}` : '';
      const response = await fetch(`/api/events/nearby?lat=${lat}&lng=${lng}&radius=15${categoryQuery}`);
      
      if (!response.ok) {
        const errorData = await response.text(); 
        console.error(`Backend failed with status ${response.status}:`, errorData);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setEvents(data); 
    } catch (error) {
      console.error("Failed to fetch nearby events:", error);
      alert("Failed to load local events. Check the console for details.");
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
        fetchNearbyEvents(latitude, longitude);
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

    if (userLocation) {
      fetchNearbyEvents(userLocation.lat, userLocation.lng, updatedCategories);
    }
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
              <div className="w-full relative flex-grow max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter zip code or city..."
                  className="w-full h-full pl-12 pr-4 py-4 border-4 border-transparent rounded-2xl focus:border-amber-300 outline-none text-slate-900 font-medium text-lg shadow-inner transition-colors"
                  readOnly 
                />
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
                  <select className="bg-white border-2 border-teal-700 text-slate-800 text-sm font-bold rounded-lg focus:ring-0 outline-none block py-2 px-3 cursor-pointer">
                    <option value="10">Within 10 miles</option>
                    <option value="15">Within 15 miles</option>
                    <option value="25">Within 25 miles</option>
                  </select>
                </div>

                {/* Categories Wrapper */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                  
                  {/* Quick Filters (Hidden on Mobile/Small, visible on Large viewports) */}
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
                                if (userLocation) fetchNearbyEvents(userLocation.lat, userLocation.lng, []);
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
            <span className="text-sm font-bold text-teal-600 bg-teal-100 px-3 py-1 rounded-full">
              {events.length} results
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}