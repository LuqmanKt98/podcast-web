'use client';

import { useState } from 'react';
import { Episode } from '@/lib/types';

interface FilterPanelProps {
  episodes: Episode[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  series?: string;
  host?: string;
  guest?: string;
  startDate?: string;
  endDate?: string;
  sortBy: 'date-desc' | 'date-asc' | 'title';
}

export default function FilterPanel({
  episodes,
  onFilterChange,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({ sortBy: 'date-desc' });

  const series = Array.from(new Set(episodes.map((e) => e.series || 'Unknown'))).sort();
  const hosts = Array.from(
    new Set(episodes.flatMap((e) => e.hosts || []))
  ).sort();
  const guests = Array.from(
    new Set(episodes.flatMap((e) => e.guests || []))
  ).sort();

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters };
    if (key === 'sortBy') {
      newFilters.sortBy = (value as 'date-desc' | 'date-asc' | 'title') || 'date-desc';
    } else if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-6 backdrop-blur-sm bg-white/80 border-2 border-white/20 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-bold gradient-text flex items-center gap-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
        </div>
        Filters
      </h3>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
          Series
        </label>
        <div className="relative">
          <select
            value={filters.series || ''}
            onChange={(e) => handleChange('series', e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200/50 bg-white/90 backdrop-blur-sm px-4 py-3 text-slate-900 font-medium focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer shadow-sm"
          >
            <option value="">All Series</option>
            {series.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
          Host
        </label>
        <div className="relative">
          <select
            value={filters.host || ''}
            onChange={(e) => handleChange('host', e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200/50 bg-white/90 backdrop-blur-sm px-4 py-3 text-slate-900 font-medium focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer shadow-sm"
          >
            <option value="">All Hosts</option>
            {hosts.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
          Guest
        </label>
        <div className="relative">
          <select
            value={filters.guest || ''}
            onChange={(e) => handleChange('guest', e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200/50 bg-white/90 backdrop-blur-sm px-4 py-3 text-slate-900 font-medium focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer shadow-sm"
          >
            <option value="">All Guests</option>
            {guests.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
          Sort By
        </label>
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) =>
              handleChange('sortBy', e.target.value)
            }
            className="w-full rounded-xl border-2 border-slate-200/50 bg-white/90 backdrop-blur-sm px-4 py-3 text-slate-900 font-medium focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer shadow-sm"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

