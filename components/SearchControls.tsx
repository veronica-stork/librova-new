'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, CalendarDays, X, Navigation, Loader2 } from 'lucide-react';
import { CATEGORIES, QUICK_FILTER_IDS } from '@/lib/categoryConstants';

export default function SearchControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [locationText, setLocationText] = useState(searchParams.get('location') || '');
  const [isLocating, setIsLocating] = useState(false);

  const quickCategories = CATEGORIES.filter(cat => QUICK_FILTER_IDS.includes(cat.id));
  const otherCategories = CATEGORIES.filter(cat => !QUICK_FILTER_IDS.includes(cat.id));

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const renderCategoryPill = (cat: typeof CATEGORIES[0]) => {
    const currentCats = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const isActive = currentCats.includes(cat.id.toString());
    
    return (
      <button
        key={cat.id}
        onClick={() => {
          const newCats = isActive 
            ? currentCats.filter(id => id !== cat.id.toString())
            : [...currentCats, cat.id.toString()];
          updateUrl({ categories: newCats.length > 0 ? newCats.join(',') : null });
        }}
        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border ${
          isActive 
            ? 'bg-rose-600 border-rose-600 text-white shadow-md' 
            : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50'
        }`}
      >
        {cat.name}
      </button>
    );
  };

  // 1. Convert text to coordinates
  const handleLocationSearch = async () => {
    const query = locationText.trim();
    if (!query) {
      updateUrl({ location: null, lat: null, lng: null });
      return;
    }

    setIsLocating(true);
    try {
      const geoUrl = /^\d{5}$/.test(query)
        ? `https://nominatim.openstreetmap.org/search?format=json&postalcode=${query}&countrycodes=us&limit=1`
        : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=1`;

      const response = await fetch(geoUrl);
      const data = await response.json();

      if (data && data.length > 0) {
        updateUrl({
          location: query,
          lat: data[0].lat,
          lng: data[0].lon,
        });
      } else {
        alert(`Could not find a location for "${query}". Try adding the state, like "${query}, NY".`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error connecting to the location search service.");
    } finally {
      setIsLocating(false);
    }
  };

  // 2. Get device location (Your HTML5 Geolocation logic)
  const handleDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationText("My Location");
        updateUrl({
          location: "My Location",
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString()
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("We need your permission to find nearby libraries!");
        setIsLocating(false);
      }
    );
  };

  const currentQ = searchParams.get('q') || '';
  const currentDate = searchParams.get('date') || 'today';

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
      
      <div className="flex flex-col md:flex-row gap-3">
        {/* Keyword Search (Updates immediately) */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events, activities, or keywords..."
            defaultValue={currentQ}
            onChange={(e) => updateUrl({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-700"
          />
        </div>

        {/* Location Search (Updates on Enter or Button Click) */}
        <div className="relative flex-grow md:max-w-[280px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Zip code or town..."
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
            className="w-full pl-10 pr-20 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-700"
          />
          {/* Action Buttons inside the location input */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button 
              onClick={handleDeviceLocation}
              disabled={isLocating}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Use my current location"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLocationSearch}
              disabled={isLocating}
              className="p-1.5 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg transition-colors"
              title="Search Location"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            showFilters 
              ? 'bg-rose-100 text-rose-700' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden md:inline">Filters</span>
        </button>
      </div>

      {/* Second Row: Quick Date Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <CalendarDays className="text-slate-400 w-5 h-5 mr-1 flex-shrink-0" />
        {[
          { id: 'today', label: 'Today' },
          { id: 'tomorrow', label: 'Tomorrow' },
          { id: 'weekend', label: 'This Weekend' },
          { id: 'all', label: 'All Upcoming' }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => updateUrl({ date: option.id })}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentDate === option.id
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Expandable Filter Drawer */}
      {showFilters && (
        <div className="pt-4 mt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Advanced Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search radius picker */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Search Radius</label>
              <input 
                type="range" min="5" max="50" step="5"
                defaultValue={searchParams.get('radius') || '15'}
                onChange={(e) => updateUrl({ radius: e.target.value })}
                className="w-full accent-rose-500" 
              />
              <div className="text-xs text-slate-500 text-right">{searchParams.get('radius') || '15'} miles</div>
            </div>

            {/* Sort by picker */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Sort By</label>
              <select 
                onChange={(e) => updateUrl({ sort: e.target.value })}
                defaultValue={searchParams.get('sort') || 'time'}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-sm text-slate-700"
              >
                <option value="time">Upcoming First</option>
                <option value="distance">Closest First</option>
              </select>
            </div>
          </div>

<div className="mt-6 pt-6 border-t border-slate-100">
  <div className="flex justify-between items-center mb-4">
    <label className="text-sm font-bold text-slate-700">Filter by Interest</label>
    {searchParams.get('categories') && (
      <button 
        onClick={() => updateUrl({ categories: null })}
        className="text-xs font-bold text-rose-600 hover:underline"
      >
        Clear All
      </button>
    )}
  </div>

  {/* Row 1: The Quick Picks (Always visible) */}
  <div className="flex flex-wrap gap-2 mb-3">
       {quickCategories.map(renderCategoryPill)}
    
    
    {/* The Toggle Button */}
    <button
      onClick={() => setShowAllCategories(!showAllCategories)}
      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1"
    >
      {showAllCategories ? 'Show Less' : `+ More (${otherCategories.length})`}
    </button>
  </div>
  </div>

  {/* Row 2: The Rest (Expandable) */}
  {showAllCategories && (
  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl animate-in fade-in zoom-in-95 duration-200">
    {otherCategories.map(renderCategoryPill)}
  </div>
)}
</div>
      )}
</div>
  )}