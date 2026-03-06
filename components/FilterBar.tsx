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
  
// Styles
  const containerStyle = "flex items-center bg-teal-600 p-1.5 rounded-xl border-2 border-teal-700 shadow-sm";
  const buttonBase = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap";
  const activeBtn = "bg-white text-teal-900 shadow-sm";
  const inactiveBtn = "text-teal-100 hover:text-white hover:bg-teal-500/50";

  return (
    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
      
      {/* Radius Group */}
      <div className={containerStyle}>
        <label className="text-[10px] uppercase tracking-widest font-black text-teal-200 px-3">
          Radius
        </label>
        <select 
          value={radius}
          onChange={onRadiusChange}
          className="bg-white border-none text-slate-800 text-xs font-bold rounded-lg focus:ring-2 focus:ring-amber-300 outline-none block py-1.5 px-3 cursor-pointer"
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