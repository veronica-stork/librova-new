import React from 'react';

interface FilterBarProps {
  radius: number;
  sortBy: 'time' | 'distance';
  hasLocation: boolean;
  onRadiusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSortChange: (type: 'time' | 'distance') => void;
}

export default function FilterBar({ 
  radius, 
  sortBy, 
  hasLocation, 
  onRadiusChange, 
  onSortChange 
}: FilterBarProps) {
  
  // Styles updated to brand variables
  const containerStyle = "flex items-center bg-librova-teal p-1.5 rounded-xl border-2 border-librova-teal shadow-sm";
  const buttonBase = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap";
  
  // Active buttons now use your vibrant accent color!
  const activeBtn = "bg-librova-accent text-white shadow-sm";
  const inactiveBtn = "text-white/80 hover:text-white hover:bg-librova-teal/80";

  return (
    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
      
      {/* Radius Group */}
      <div className={containerStyle}>
        <label className="text-[10px] uppercase tracking-widest font-black text-white/70 px-3">
          Radius
        </label>
        <select 
          value={radius}
          onChange={onRadiusChange}
          className="bg-white border-none text-librova-dark text-xs font-bold rounded-lg focus:ring-2 focus:ring-librova-accent outline-none block py-1.5 px-3 cursor-pointer"
        >
          <option value="10">10 Miles</option>
          <option value="15">15 Miles</option>
          <option value="25">25 Miles</option>
        </select>
      </div>

      {/* Sort Group */}
      <div className={containerStyle}>
        <button
          onClick={() => onSortChange('time')}
          className={`${buttonBase} ${sortBy === 'time' ? activeBtn : inactiveBtn}`}
        >
          Soonest
        </button>
        <button
          disabled={!hasLocation}
          onClick={() => onSortChange('distance')}
          className={`${buttonBase} ${!hasLocation ? 'opacity-40 cursor-not-allowed' : ''} ${
            sortBy === 'distance' ? activeBtn : inactiveBtn
          }`}
        >
          Closest
        </button>
      </div>

    </div>
  );
}