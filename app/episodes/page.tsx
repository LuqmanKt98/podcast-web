'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Header from '@/components/Header';
import EditableEpisodeCard from '@/components/EditableEpisodeCard';
import FilterPanel, { FilterState } from '@/components/FilterPanel';
import SearchBar from '@/components/SearchBar';
import FloatingButton from '@/components/FloatingButton';
import SkeletonLoader from '@/components/SkeletonLoader';
import MergeManager from '@/components/MergeManager';
import { Episode } from '@/lib/types';
import { loadEpisodes, filterEpisodes, sortEpisodes, searchEpisodes, clearCache } from '@/lib/data';
import { db } from '@/lib/firebase';
import {
  pageVariants,
  pageTransition,
  prefersReducedMotion,
} from '@/lib/animations';

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ sortBy: 'date-desc' });
  const [showMergeManager, setShowMergeManager] = useState(false);

  const handleEpisodeUpdate = async (episodeId: string, updates: Partial<Episode>) => {
    const episode = episodes.find(e => e.id === episodeId);
    const docId = episode?.firestoreId || episodeId;

    try {
      await updateDoc(doc(db, 'episodes', docId), updates);
      clearCache();
      setEpisodes(prev => prev.map(ep =>
        ep.id === episodeId ? { ...ep, ...updates } : ep
      ));
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

  // Function to refresh episodes data
  const refreshEpisodes = async () => {
    try {
      clearCache();
      const data = await loadEpisodes();
      setEpisodes(data);
      setFilteredEpisodes(data);
    } catch (error) {
      console.error('Error refreshing episodes:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadEpisodes();
        setEpisodes(data);
        setFilteredEpisodes(data);
      } catch (error) {
        console.error('Error loading episodes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = episodes;

    // Apply search
    if (searchQuery.trim()) {
      result = searchEpisodes(result, searchQuery).map((r) => r.episode);
    }

    // Apply filters
    result = filterEpisodes(result, {
      series: filters.series,
      host: filters.host,
      guest: filters.guest,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    // Apply sorting
    result = sortEpisodes(result, filters.sortBy);

    setFilteredEpisodes(result);
  }, [episodes, searchQuery, filters]);

  const reducedMotion = prefersReducedMotion();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SkeletonLoader type="card" count={6} />
        </main>
      </div>
    );
  }

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
        <motion.div
          className="mb-8"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-3">All Episodes</h1>
              <p className="text-caption text-lg">
                Showing {filteredEpisodes.length} of {episodes.length} episodes
              </p>
            </div>
            <button
              onClick={() => setShowMergeManager(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Manage Duplicates
            </button>
          </div>
        </motion.div>

        <motion.div
          className="mb-8"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.1 }}
        >
          <SearchBar onSearch={setSearchQuery} />
        </motion.div>

        <div className="space-y-8">
          <FilterPanel episodes={episodes} onFilterChange={setFilters} />

          {filteredEpisodes.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEpisodes.map((episode, index) => (
                <div key={`${episode.id}-${index}`}>
                  <EditableEpisodeCard
                    episode={episode}
                    onSave={handleEpisodeUpdate}
                    onDelete={handleEpisodeDelete}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="backdrop-blur-sm bg-white/90 border-2 border-white/20 rounded-2xl shadow-xl p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-slate-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 515.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-heading mb-2">
                No episodes found
              </h3>
              <p className="text-body">
                Try adjusting your search terms or filters to find more episodes
              </p>
            </div>
          )}
        </div>
      </main>

      <FloatingButton />

      {/* Merge Manager Modal */}
      <AnimatePresence>
        {showMergeManager && (
          <MergeManager
            episodes={episodes}
            onMergeComplete={refreshEpisodes}
            onClose={() => setShowMergeManager(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}