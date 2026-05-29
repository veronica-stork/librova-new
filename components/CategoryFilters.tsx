import React from 'react';

interface Category {
  id: number;
  name: string;
}

interface CategoryFiltersProps {
  categories: Category[];
  quickFilterIds: number[];
  selectedCategories: number[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  toggleCategory: (id: number) => void;
  onClearAll: () => void;
}

export default function CategoryFilters({
  categories,
  quickFilterIds,
  selectedCategories,
  isDropdownOpen,
  setIsDropdownOpen,
  toggleCategory,
  onClearAll
}: CategoryFiltersProps) {
  
  const pillBase = "px-4 py-2 rounded-xl font-bold text-sm border-b-4 transition-all cursor-pointer whitespace-nowrap";
  
  const activePill = "bg-librova-pink/10 border-librova-pink/20 text-white active:border-b-0 active:translate-y-1";
  
  // Inactive pill uses your Dark/Teal brand palette
  const inactivePill = "bg-white border-librova-border text-librova-dark/60 hover:bg-librova-light hover:border-librova-teal active:border-b-0 active:translate-y-1";

  return (
    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
      
      {/* Quick Filter Pills (Desktop Only) */}
      <div className="hidden lg:flex items-center gap-2">
        {quickFilterIds.map((id) => {
          const category = categories.find(c => c.id === id);
          if (!category) return null;
          const isActive = selectedCategories.includes(id);
          
          return (
            <button
              key={`quick-${id}`}
              onClick={() => toggleCategory(id)}
              className={`${pillBase} ${isActive ? activePill : inactivePill}`}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Main Dropdown */}
      <div className="relative w-full lg:w-auto">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full lg:w-auto flex justify-between items-center px-5 py-3 bg-white border-2 border-librova-teal text-librova-dark font-bold text-sm rounded-xl hover:bg-librova-light transition-colors"
        >
          <span>
            More Categories {selectedCategories.length > 0 && (
              // Badge uses your Accent color
              <span className="ml-1 bg-librova-accent text-white px-2 py-0.5 rounded-full text-xs">
                {selectedCategories.length}
              </span>
            )}
          </span>
          <svg className={`w-5 h-5 ml-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-20 mt-2 w-full lg:w-56 right-0 bg-white border-2 border-librova-teal rounded-xl shadow-xl overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center p-2 hover:bg-librova-light rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    // Checkbox accent set to your brand Teal
                    className="w-5 h-5 accent-librova-teal border-2 border-librova-border rounded cursor-pointer"
                  />
                  <span className="ml-3 text-sm font-semibold text-librova-dark/80">{category.name}</span>
                </label>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <div className="p-2 border-t border-librova-border bg-librova-light">
                <button 
                  onClick={onClearAll}
                  className="w-full text-sm font-bold text-librova-red hover:text-red-700 py-1"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}