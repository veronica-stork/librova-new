import React from 'react';
import { MapPin, ExternalLink, Info, CalendarX } from 'lucide-react';

export interface Library {
  id: number;
  name: string;
  address: string;
  website_url?: string;
  calendar_status: 'active' | 'inactive' | 'manual_only';
}

interface LibraryDirectoryProps {
  libraries: Library[];
}

export const LibraryDirectory: React.FC<LibraryDirectoryProps> = ({ libraries }) => {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-teal-900 tracking-tight mb-2">
          Local Libraries
        </h2>
        <p className="text-slate-600 text-lg">
          Find your nearest branch, check their hours, and explore their resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {libraries.map((lib) => (
          <div 
            key={lib.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
                {lib.name}
              </h3>
              
              <div className="flex items-start text-slate-600 mb-4 text-sm">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-rose-500" />
                <span>{lib.address}</span>
              </div>

              {/* Status Badge
              {lib.calendar_status === 'inactive' && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md mb-4 border border-amber-100">
                  <CalendarX className="w-3.5 h-3.5" />
                  Events posted on Facebook
                </div>
              )} */}
            </div>

            <div className="pt-4 mt-auto border-t border-slate-100 flex gap-3">
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(lib.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
              >
                Directions
              </a>
              {lib.website_url && (
                <a 
                  href={lib.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Website
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};