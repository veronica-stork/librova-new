'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, CalendarDays, X, Navigation, Loader2 } from 'lucide-react';
import { CATEGORIES, QUICK_FILTER_IDS } from '@/lib/categoryConstants';
import Link from 'next/link';

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
            ? 'bg-librova-accent border-librova-accent text-white shadow-md' 
            : 'bg-white border-librova-border text-librova-dark/60 hover:border-librova-teal hover:bg-librova-light'
        }`}
      >
        {cat.name}
      </button>
    );
  };

  const handleLocationSearch = async () => {
    const query = locationText.trim();
    if (!query) {
      updateUrl({ location: null, lat: null, lng: null, sort: null });
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
          sort: 'distance',
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

  const handleDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationText("My Location");
        updateUrl({
          location: "My Location",
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
          sort: 'distance'
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        alert("Location access denied or unavailable.");
      },
      options
    );
  };

  const currentQ = searchParams.get('q') || '';
  const currentDate = searchParams.get('date') || 'today';

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-librova-border p-4 space-y-4">

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-librova-dark/30 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events, activities, or keywords..."
            defaultValue={currentQ}
            onChange={(e) => updateUrl({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-librova-light border-none rounded-xl focus:ring-2 focus:ring-librova-teal outline-none text-librova-dark"
          />
        </div>

        <div className="relative flex-grow md:max-w-[280px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-librova-dark/30 w-5 h-5" />
          <input
            type="text"
            placeholder="Zip code or town..."
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
            className="w-full pl-10 pr-20 py-3 bg-librova-light border-none rounded-xl focus:ring-2 focus:ring-librova-teal outline-none text-librova-dark"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button 
              onClick={handleDeviceLocation}
              disabled={isLocating}
              className="p-1.5 text-librova-dark/40 hover:text-librova-teal hover:bg-librova-light rounded-lg transition-colors"
              title="Use my current location"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLocationSearch}
              disabled={isLocating}
              className="p-1.5 bg-librova-border text-librova-dark/60 hover:bg-librova-border/80 rounded-lg transition-colors"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            showFilters 
              ? 'bg-librova-teal/10 text-librova-teal' 
              : 'bg-librova-light text-librova-dark/70 hover:bg-librova-border'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden md:inline">Filters</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <CalendarDays className="text-librova-dark/30 w-5 h-5 mr-1 flex-shrink-0" />
        {[
          { id: 'today', label: 'Today' },
          { id: 'tomorrow', label: 'Tomorrow' },
          { id: 'weekend', label: 'This Weekend' },
          { id: 'all', label: 'All Upcoming' }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => updateUrl({ date: option.id })}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
              currentDate === option.id
                ? 'bg-librova-dark text-white shadow-md'
                : 'bg-white border border-librova-border text-librova-dark/60 hover:border-librova-teal hover:bg-librova-light'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="pt-4 mt-4 border-t border-librova-light animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-librova-dark">Advanced Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-librova-dark/40 hover:text-librova-dark">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-librova-dark/70">Search Radius</label>
              <input 
                type="range" min="5" max="50" step="5"
                defaultValue={searchParams.get('radius') || '15'}
                onChange={(e) => updateUrl({ radius: e.target.value })}
                className="w-full accent-librova-accent" 
              />
              <div className="text-xs text-librova-dark/50 text-right">{searchParams.get('radius') || '15'} miles</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-librova-dark/70">Sort By</label>
              <select 
                onChange={(e) => updateUrl({ sort: e.target.value })}
                value={searchParams.get('sort') || 'time'}
                className="w-full p-2 bg-librova-light border border-librova-border rounded-lg outline-none focus:ring-2 focus:ring-librova-teal text-sm text-librova-dark"
              >
                <option value="time">Upcoming First</option>
                <option value="distance">Closest First</option>
              </select>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-librova-light">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-librova-dark">Filter by Interest</label>
              {searchParams.get('categories') && (
                <button 
                  onClick={() => updateUrl({ categories: null })}
                  className="text-xs font-bold text-librova-red hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {quickCategories.map(renderCategoryPill)}
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-librova-light text-librova-dark/50 hover:bg-librova-border transition-colors flex items-center gap-1"
              >
                {showAllCategories ? 'Show Less' : `+ More (${otherCategories.length})`}
              </button>
            </div>
          </div>

          {showAllCategories && (
            <div className="flex flex-wrap gap-2 p-3 bg-librova-light rounded-xl animate-in fade-in zoom-in-95 duration-200">
              {otherCategories.map(renderCategoryPill)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}