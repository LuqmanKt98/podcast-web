'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Episode } from '@/lib/types';
import ConfirmDialog from './ConfirmDialog';

interface EditableEpisodeCardProps {
  episode: Episode;
  onSave?: (episodeId: string, updates: Partial<Episode>) => void;
  onDelete?: (episodeId: string) => void;
}

export default function EditableEpisodeCard({ episode, onSave, onDelete }: EditableEpisodeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editData, setEditData] = useState({
    episodeTitle: episode.episodeTitle || '',
    series: episode.series || '',
    episodeNumber: episode.episodeNumber || '',
    date: episode.date || '',
    hosts: episode.hosts?.join(', ') || '',
    guests: episode.guests?.join(', ') || '',
  });

  const formattedDate = episode.date ? new Date(episode.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'No date';

  const handleSave = () => {
    const updates: Partial<Episode> = {
      episodeTitle: editData.episodeTitle,
      series: editData.series,
      episodeNumber: editData.episodeNumber,
      date: editData.date,
      hosts: editData.hosts.split(',').map(h => h.trim()).filter(h => h),
      guests: editData.guests.split(',').map(g => g.trim()).filter(g => g),
    };
    onSave?.(episode.id, updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      episodeTitle: episode.episodeTitle || '',
      series: episode.series || '',
      episodeNumber: episode.episodeNumber || '',
      date: episode.date || '',
      hosts: episode.hosts?.join(', ') || '',
      guests: episode.guests?.join(', ') || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.(episode.id);
    setShowConfirm(false);
  };

  if (isEditing) {
    return (
      <>
        <ConfirmDialog
          isOpen={showConfirm}
          title="Delete Episode"
          message={`Are you sure you want to delete "${episode.episodeTitle}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
        <div className="group relative overflow-hidden backdrop-blur-sm bg-white/90 border-2 border-blue-200 rounded-2xl shadow-xl p-4 space-y-3 min-h-[500px]">
        <h4 className="font-semibold text-slate-800 text-sm mb-3">Edit Episode</h4>
        
        <div className="space-y-2">
          <input
            type="text"
            value={editData.series}
            onChange={(e) => setEditData({...editData, series: e.target.value})}
            placeholder="Series"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-xs"
          />
          
          <input
            type="text"
            value={editData.episodeNumber}
            onChange={(e) => setEditData({...editData, episodeNumber: e.target.value})}
            placeholder="Episode #"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-xs"
          />
          
          <textarea
            value={editData.episodeTitle}
            onChange={(e) => setEditData({...editData, episodeTitle: e.target.value})}
            placeholder="Episode Title"
            rows={2}
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-xs resize-none"
          />
          
          <input
            type="date"
            value={editData.date}
            onChange={(e) => setEditData({...editData, date: e.target.value})}
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-xs"
          />
          
          <textarea
            value={editData.hosts}
            onChange={(e) => setEditData({...editData, hosts: e.target.value})}
            placeholder="Hosts (comma separated)"
            rows={2}
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-xs resize-none"
          />
          
          <textarea
            value={editData.guests}
            onChange={(e) => setEditData({...editData, guests: e.target.value})}
            placeholder="Guests (comma separated)"
            rows={2}
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-xs resize-none"
          />
        </div>

        <div className="flex flex-col gap-1 pt-3 border-t">
          <button
            onClick={handleSave}
            className="w-full px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="w-full px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium"
          >
            Delete
          </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <div className="h-full group relative">
      {/* Edit Button */}
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      <Link href={`/episodes/${episode.id}`} className="block h-full">
        <div className="group relative overflow-hidden cursor-pointer backdrop-blur-sm bg-white/90 border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl h-full flex flex-col transition-all duration-300 hover:border-blue-200/50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl" />
          
          <div className="relative z-10 flex flex-col h-full p-6">
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-block rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                  {episode.series || 'Unknown'}
                </span>
                {episode.episodeNumber && (
                  <span className="text-xs text-slate-500 font-bold bg-slate-100/80 px-3 py-1 rounded-lg">
                    #{episode.episodeNumber}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-heading line-clamp-2 group-hover:gradient-text transition-all duration-300 leading-tight">
                {episode.episodeTitle || 'Untitled Episode'}
              </h3>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700">{formattedDate}</p>
              </div>

              {episode.hosts && episode.hosts.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl p-3 border border-blue-100/50">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Hosts
                  </p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{episode.hosts.join(', ')}</p>
                </div>
              )}

              {episode.guests && episode.guests.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 rounded-xl p-3 border border-emerald-100/50">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Guests
                  </p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">{episode.guests.join(', ')}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t-2 border-gradient-to-r from-blue-100 to-purple-100 pt-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-gradient-to-br from-orange-100 to-red-100">
                  <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-600">
                  {episode.wordCount > 0 ? episode.wordCount.toLocaleString() : 'N/A'} words
                </span>
              </div>
              <motion.div
                whileHover={{ x: 4, scale: 1.05 }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg group-hover:shadow-xl transition-all duration-200"
              >
                Read More
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}