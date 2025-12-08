'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Header from '@/components/Header';
import EditableStatsCard from '@/components/EditableStatsCard';
import EditableEpisodeCard from '@/components/EditableEpisodeCard';
import EditableSeriesCard from '@/components/EditableSeriesCard';
import FloatingButton from '@/components/FloatingButton';
import SkeletonLoader from '@/components/SkeletonLoader';
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

// Series Breakdown Section with See More functionality
function SeriesBreakdownSection({ stats }: { stats: DashboardStats }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW_COUNT = 8;

  const sortedSeries = Object.entries(stats.seriesBreakdown).sort((a, b) => b[1] - a[1]);
  const displayedSeries = showAll ? sortedSeries : sortedSeries.slice(0, INITIAL_SHOW_COUNT);
  const hasMore = sortedSeries.length > INITIAL_SHOW_COUNT;

  return (
    <div className="mb-12 card-elevated p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold gradient-text">
          Series Breakdown
        </h3>
        <span className="text-sm text-slate-500">
          {sortedSeries.length} series total
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {displayedSeries.map(([series, count]) => (
          <EditableSeriesCard
            key={series}
            series={series}
            count={count}
            onSave={(oldSeries, newSeries, newCount) => {
              console.log('Save series:', { oldSeries, newSeries, newCount });
            }}
            onDelete={(series) => {
              console.log('Delete series:', series);
            }}
          />
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

        {/* Stats Grid */}
        {stats && (
          <motion.div
            variants={reducedMotion ? {} : staggerContainerVariants}
            initial="initial"
            animate="animate"
            className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <EditableStatsCard
                label="Total Episodes"
                value={stats.totalEpisodes}
                color="blue"
                icon="📻"
                onSave={(newLabel, newValue) => {
                  console.log('Updated:', newLabel, '=', newValue);
                  // Update stats in state
                  setStats(prev => prev ? { ...prev, totalEpisodes: Number(newValue) } : null);
                }}
              />
            </motion.div>
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <EditableStatsCard
                label="Unique Guests"
                value={stats.totalGuests}
                color="purple"
                icon="👥"
                onSave={(newLabel, newValue) => {
                  console.log('Updated:', newLabel, '=', newValue);
                  setStats(prev => prev ? { ...prev, totalGuests: Number(newValue) } : null);
                }}
              />
            </motion.div>
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <EditableStatsCard
                label="Unique Hosts"
                value={stats.totalHosts}
                color="green"
                icon="🎙️"
                onSave={(newLabel, newValue) => {
                  console.log('Updated:', newLabel, '=', newValue);
                  setStats(prev => prev ? { ...prev, totalHosts: Number(newValue) } : null);
                }}
              />
            </motion.div>
            <motion.div variants={reducedMotion ? {} : staggerItemVariants}>
              <EditableStatsCard
                label="Date Range"
                value={`${stats.dateRange.earliest} to ${stats.dateRange.latest}`}
                color="orange"
                icon="📅"
                isDateRange={true}
                onSave={(newLabel, newValue) => {
                  console.log('Updated:', newLabel, '=', newValue);
                  const parts = String(newValue).split(' to ');
                  if (parts.length === 2) {
                    setStats(prev => prev ? {
                      ...prev,
                      dateRange: { earliest: parts[0], latest: parts[1] }
                    } : null);
                  }
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Series Breakdown */}
        {stats && Object.keys(stats.seriesBreakdown).length > 0 && (
          <SeriesBreakdownSection stats={stats} />
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
    </motion.div>
  );
}
