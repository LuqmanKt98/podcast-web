'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateDoc, deleteDoc, doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import EditableEpisodeCard from '@/components/EditableEpisodeCard';
import FloatingButton from '@/components/FloatingButton';
import SkeletonLoader from '@/components/SkeletonLoader';
import MergeManager from '@/components/MergeManager';
import { Episode, DashboardStats } from '@/lib/types';
import { loadEpisodes, calculateStats, sortEpisodes, clearCache } from '@/lib/data';
import { db } from '@/lib/firebase';
import {
  pageVariants,
  pageTransition,
  staggerContainerVariants,
  staggerItemVariants,
  prefersReducedMotion,
} from '@/lib/animations';

// Series Breakdown Section with edit and delete functionality
interface SeriesBreakdownSectionProps {
  stats: DashboardStats;
  episodes: Episode[];
  onSeriesUpdate: (oldSeries: string, newSeries: string) => Promise<void>;
  onSeriesDelete: (series: string) => Promise<void>;
  onOpenMergeManager: () => void;
}

function SeriesBreakdownSection({
  stats,
  episodes,
  onSeriesUpdate,
  onSeriesDelete,
  onOpenMergeManager
}: SeriesBreakdownSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const INITIAL_SHOW_COUNT = 8;

  const sortedSeries = Object.entries(stats.seriesBreakdown).sort((a, b) => b[1] - a[1]);
  const displayedSeries = showAll ? sortedSeries : sortedSeries.slice(0, INITIAL_SHOW_COUNT);
  const hasMore = sortedSeries.length > INITIAL_SHOW_COUNT;

  const handleStartEdit = (series: string) => {
    setEditingSeries(series);
    setEditValue(series);
  };

  const handleSaveEdit = async () => {
    if (!editingSeries || !editValue.trim()) return;
    if (editValue.trim() === editingSeries) {
      setEditingSeries(null);
      return;
    }

    setIsUpdating(true);
    try {
      await onSeriesUpdate(editingSeries, editValue.trim());
      setEditingSeries(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSeries(null);
    setEditValue('');
  };

  const handleDelete = async (series: string) => {
    if (!confirm(`Are you sure you want to delete all episodes in "${series}"? This action cannot be undone.`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await onSeriesDelete(series);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mb-12 card-elevated p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold gradient-text">
            Series Breakdown
          </h3>
          <span className="text-sm text-slate-500">
            {sortedSeries.length} series total
          </span>
        </div>
        <button
          onClick={onOpenMergeManager}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Merge Duplicates
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {displayedSeries.map(([series, count]) => (
          <motion.div
            key={series}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center hover:shadow-md transition-all border border-slate-200 relative group"
          >
            {/* Edit/Delete Buttons */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => handleStartEdit(series)}
                disabled={isUpdating}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                title="Rename series"
              >
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(series)}
                disabled={isUpdating}
                className="p-1 rounded hover:bg-red-200 disabled:opacity-50"
                title="Delete series (removes all episodes)"
              >
                <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {editingSeries === series ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold gradient-text">{count}</p>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                  className="text-sm font-medium text-slate-700 bg-white border border-blue-300 rounded px-2 py-1 w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1 justify-center mt-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isUpdating}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                  >
                    {isUpdating ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold gradient-text">{count}</p>
                <p className="text-sm font-medium text-slate-700">{series}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all inline-flex items-center gap-2"
          >
            {showAll ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                See Less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                See More ({sortedSeries.length - INITIAL_SHOW_COUNT} more)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMergeManager, setShowMergeManager] = useState(false);

  // Refresh data from Firebase
  const refreshData = async () => {
    try {
      clearCache();
      const data = await loadEpisodes();
      setEpisodes(data);
      setStats(calculateStats(data));
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleEpisodeUpdate = async (episodeId: string, updates: Partial<Episode>) => {
    const episode = episodes.find(e => e.id === episodeId);
    const docId = episode?.firestoreId || episodeId;

    try {
      await updateDoc(doc(db, 'episodes', docId), updates);
      clearCache();
      setEpisodes(prev => prev.map(ep => ep.id === episodeId ? { ...ep, ...updates } : ep));
      toast.success('Episode updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEpisodeDelete = async (episodeId: string) => {
    const episode = episodes.find(e => e.id === episodeId);
    const docId = episode?.firestoreId || episodeId;

    try {
      await deleteDoc(doc(db, 'episodes', docId));
      clearCache();
      setEpisodes(prev => prev.filter(ep => ep.id !== episodeId));
      toast.success('Episode deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update series name for all episodes with that series
  const handleSeriesUpdate = async (oldSeries: string, newSeries: string) => {
    try {
      const episodesRef = collection(db, 'episodes');
      const snapshot = await getDocs(episodesRef);

      let updatedCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.series === oldSeries) {
          await updateDoc(doc(db, 'episodes', docSnap.id), { series: newSeries });
          updatedCount++;
        }
      }

      clearCache();
      await refreshData();
      toast.success(`Renamed "${oldSeries}" to "${newSeries}" (${updatedCount} episodes updated)`);
    } catch (error) {
      console.error('Series update error:', error);
      toast.error(`Failed to update series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Delete all episodes with a specific series
  const handleSeriesDelete = async (series: string) => {
    try {
      const episodesRef = collection(db, 'episodes');
      const snapshot = await getDocs(episodesRef);

      let deletedCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.series === series) {
          await deleteDoc(doc(db, 'episodes', docSnap.id));
          deletedCount++;
        }
      }

      clearCache();
      await refreshData();
      toast.success(`Deleted series "${series}" (${deletedCount} episodes removed)`);
    } catch (error) {
      console.error('Series delete error:', error);
      toast.error(`Failed to delete series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadEpisodes();
        setEpisodes(data);
        setStats(calculateStats(data));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (episodes.length > 0) {
      setStats(calculateStats(episodes));
    }
  }, [episodes]);

  const recentEpisodes = sortEpisodes(episodes, 'date-desc').slice(0, 6);

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      // Handle YYYY-MM-DD format explicitly
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      // Fallback: try parsing directly
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SkeletonLoader type="stats" />
        </main>
      </div>
    );
  }

  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      className="min-h-screen bg-slate-50"
      variants={reducedMotion ? {} : pageVariants}
      initial="initial"
      animate="animate"
      transition={pageTransition}
    >
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6 }}
          className="mb-12 overflow-hidden rounded-2xl gradient-primary px-8 py-16 text-white shadow-xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative z-10">
            <motion.h2
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Welcome to Our Podcast Archive
            </motion.h2>
            <motion.p
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.2 }}
              className="text-lg text-blue-100 max-w-2xl"
            >
              Discover insightful conversations with industry leaders, experts, and innovators across various fields
            </motion.p>
          </div>
        </motion.div>

        {/* Stats Grid - Read-only computed values */}
        {stats && (
          <motion.div
            variants={reducedMotion ? {} : staggerContainerVariants}
            initial="initial"
            animate="animate"
            className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <StatsCard
                label="Total Episodes"
                value={stats.totalEpisodes}
                color="blue"
                icon="📻"
              />
            </motion.div>
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <StatsCard
                label="Unique Guests"
                value={stats.totalGuests}
                color="purple"
                icon="👥"
              />
            </motion.div>
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <StatsCard
                label="Unique Hosts"
                value={stats.totalHosts}
                color="green"
                icon="🎙️"
              />
            </motion.div>
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <StatsCard
                label="Date Range"
                value={`${formatDate(stats.dateRange.earliest)} - ${formatDate(stats.dateRange.latest)}`}
                color="orange"
                icon="📅"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Series Breakdown */}
        {stats && Object.keys(stats.seriesBreakdown).length > 0 && (
          <SeriesBreakdownSection
            stats={stats}
            episodes={episodes}
            onSeriesUpdate={handleSeriesUpdate}
            onSeriesDelete={handleSeriesDelete}
            onOpenMergeManager={() => setShowMergeManager(true)}
          />
        )}

        {/* Recent Episodes */}
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.4 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-2xl font-bold gradient-text">
              Recent Episodes
            </h3>
            <motion.a
              href="/episodes"
              whileHover={{ x: 4 }}
              className="btn-secondary flex items-center gap-2"
            >
              View All Episodes
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.a>
          </div>
          <motion.div
            variants={reducedMotion ? {} : staggerContainerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {recentEpisodes.map((episode, index) => (
              <motion.div
                key={`${episode.id}-${index}`}
                variants={reducedMotion ? {} : staggerItemVariants}
              >
                <EditableEpisodeCard
                  episode={episode}
                  onSave={handleEpisodeUpdate}
                  onDelete={handleEpisodeDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      <FloatingButton />

      {/* Merge Manager Modal */}
      <AnimatePresence>
        {showMergeManager && (
          <MergeManager
            episodes={episodes}
            onMergeComplete={refreshData}
            onClose={() => setShowMergeManager(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
