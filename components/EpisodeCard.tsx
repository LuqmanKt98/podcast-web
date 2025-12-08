'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Episode } from '@/lib/types';
import { hoverScaleVariants, prefersReducedMotion } from '@/lib/animations';
import { useScrollAnimation } from '@/lib/useScrollAnimation';

interface EpisodeCardProps {
  episode: Episode;
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const reducedMotion = prefersReducedMotion();
  const formattedDate = episode.date ? new Date(episode.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'No date';
  
  const seriesName = episode.series || 'Unknown';
  const episodeNum = episode.episodeNumber || '?';
  const title = episode.episodeTitle || 'Untitled Episode';
  const hosts = episode.hosts || [];
  const guests = episode.guests || [];
  const wordCount = episode.wordCount || 0;

  return (
    <div className="h-full">
      <Link href={`/episodes/${episode.id}`} className="block h-full">
        <div className="group relative overflow-hidden cursor-pointer backdrop-blur-sm bg-white/90 border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl h-full flex flex-col transition-all duration-300 hover:border-blue-200/50">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl" />
          
          {/* Floating orb effects */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />

          <div className="relative z-10 flex flex-col h-full p-6">
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={isVisible ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.3, delay: 0.1 }}
                  className="inline-block rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                >
                  {seriesName}
                </motion.span>
                {episodeNum !== '?' && (
                  <span className="text-xs text-slate-500 font-bold bg-slate-100/80 px-3 py-1 rounded-lg">
                    #{episodeNum}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-heading line-clamp-2 group-hover:gradient-text transition-all duration-300 leading-tight">
                {title}
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

              {hosts.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl p-3 border border-blue-100/50">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Hosts
                  </p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{hosts.join(', ')}</p>
                </div>
              )}

              {guests.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 rounded-xl p-3 border border-emerald-100/50">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Guests
                  </p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">{guests.join(', ')}</p>
                </div>
              )}
              

              {hosts.length === 0 && guests.length === 0 && (
                <div className="bg-gradient-to-r from-gray-50/50 to-slate-50/50 rounded-xl p-3 border border-gray-100/50">
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No host/guest info
                  </p>
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
                  {wordCount > 0 ? wordCount.toLocaleString() : 'N/A'} words
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

