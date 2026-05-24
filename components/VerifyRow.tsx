'use client';

import { useState } from 'react';

interface VerifyRowProps {
  event: {
    id: number;
    title: string;
    description: string;
    start_time: string;
    primary_category_id: number | null;
    ai_primary_category_id: number | null;
  };
  categories: Array<{ id: number; tag_name: string }>;
}

export default function VerifyRow({ event, categories }: VerifyRowProps) {
  // Prefer human-assigned category if it exists, otherwise fallback to AI's guess
  const initialSelection = event.primary_category_id || event.ai_primary_category_id || '';
  const [selectedCategory, setSelectedCategory] = useState<string | number>(initialSelection);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const handleVerify = async () => {
    if (!selectedCategory) return;
    setStatus('saving');

    try {
      const response = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          primary_category_id: Number(selectedCategory),
          category_ids: [Number(selectedCategory)],
        }),
      });

      if (response.ok) {
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  // If successfully verified, we hide the row
  if (status === 'done') return null;

  const eventDate = new Date(event.start_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`p-4 border rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between 
      ${status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:shadow-sm'}`}>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{eventDate}</span>
          {event.ai_primary_category_id && (
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              AI ID: {event.ai_primary_category_id}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 truncate mt-1">{event.title}</h3>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-sm border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-48"
          disabled={status === 'saving'}
        >
          <option value="">-- Choose Category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.tag_name}
            </option>
          ))}
        </select>

        <button
          onClick={handleVerify}
          disabled={status === 'saving' || !selectedCategory}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition disabled:bg-gray-400"
        >
          {status === 'saving' ? 'Saving...' : 'Verify'}
        </button>
      </div>
    </div>
  );
}