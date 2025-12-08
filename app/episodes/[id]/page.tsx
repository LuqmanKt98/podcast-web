'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Header from '@/components/Header';
import EditableTranscriptViewer from '@/components/EditableTranscriptViewer';
import EditableGuestExperience from '@/components/EditableGuestExperience';
import EditableHostsGuests from '@/components/EditableHostsGuests';
import FloatingButton from '@/components/FloatingButton';
import SkeletonLoader from '@/components/SkeletonLoader';
import { Episode } from '@/lib/types';
import { loadEpisodes, clearCache } from '@/lib/data';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  pageVariants,
  pageTransition,
  slideUpVariants,
  prefersReducedMotion,
} from '@/lib/animations';

interface EpisodeDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EpisodeDetail({ params: paramsPromise }: EpisodeDetailProps) {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const router = useRouter();

  const handleTranscriptUpdate = async (newTranscript: string) => {
    if (!episode) return;
    const docId = episode.firestoreId || episode.id;
    try {
      await updateDoc(doc(db, 'episodes', docId), { transcript: newTranscript });
      clearCache();
      setEpisode({ ...episode, transcript: newTranscript });
      toast.success('Transcript updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGuestExperienceUpdate = async (experiences: any[]) => {
    if (!episode) return;
    const docId = episode.firestoreId || episode.id;
    try {
      await updateDoc(doc(db, 'episodes', docId), { guestWorkExperience: experiences });
      clearCache();
      setEpisode({ ...episode, guestWorkExperience: experiences });
      toast.success('Guest experience updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update guest experience: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!episode) return;
    const docId = episode.firestoreId || episode.id;
    try {
      await deleteDoc(doc(db, 'episodes', docId));
      clearCache();
      toast.success('Episode deleted successfully');
      router.push('/episodes');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    const resolveParams = async () => {
      const params = await paramsPromise;
      setEpisodeId(params.id);
    };
    resolveParams();
  }, [paramsPromise]);

  useEffect(() => {
    if (!episodeId) return;

    const fetchEpisode = async () => {
      try {
        const episodes = await loadEpisodes();
        const found = episodes.find((e) => e.id === episodeId);
        setEpisode(found || null);
      } catch (error) {
        console.error('Error loading episode:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisode();
  }, [episodeId]);

  const reducedMotion = prefersReducedMotion();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <SkeletonLoader type="text" count={10} />
        </main>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.4 }}
            className="card-elevated p-12 text-center"
          >
            <h1 className="text-2xl font-bold text-heading mb-3">Episode not found</h1>
            <p className="text-body mb-6">
              The episode you're looking for doesn't exist or may have been moved.
            </p>
            <Link
              href="/episodes"
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Episodes
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(episode.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Episode"
        message={`Are you sure you want to delete "${episode?.episodeTitle}"?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <motion.div
        className="min-h-screen bg-slate-50"
        variants={reducedMotion ? {} : pageVariants}
        initial="initial"
        animate="animate"
        transition={pageTransition}
      >
        <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/episodes"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Episodes
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Episode
            </button>
          </div>
        </motion.div>

        <motion.article
          variants={reducedMotion ? {} : slideUpVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
          className="card-elevated p-8"
        >
          {/* Header */}
          <div className="mb-8 border-b border-slate-200 pb-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-block rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-sm">
                {episode.series}
              </span>
              <span className="text-sm text-caption font-medium">
                Episode {episode.episodeNumber}
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold gradient-text">
              {episode.episodeTitle}
            </h1>
            <p className="text-lg text-body">{formattedDate}</p>
          </div>

          {/* Metadata */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {episode.hosts.length > 0 && (
              <EditableHostsGuests
                title="Hosts"
                names={episode.hosts}
                icon="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                color="blue"
                onSave={async (newNames) => {
                  const docId = episode.firestoreId || episode.id;
                  try {
                    await updateDoc(doc(db, 'episodes', docId), { hosts: newNames });
                    clearCache();
                    setEpisode({ ...episode, hosts: newNames });
                    toast.success('Hosts updated successfully');
                  } catch (error) {
                    console.error('Update error:', error);
                    toast.error(`Failed to update hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
              />
            )}

            {episode.guests.length > 0 && (
              <EditableHostsGuests
                title="Guests"
                names={episode.guests}
                icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                color="purple"
                onSave={async (newNames) => {
                  const docId = episode.firestoreId || episode.id;
                  try {
                    await updateDoc(doc(db, 'episodes', docId), { guests: newNames });
                    clearCache();
                    setEpisode({ ...episode, guests: newNames });
                    toast.success('Guests updated successfully');
                  } catch (error) {
                    console.error('Update error:', error);
                    toast.error(`Failed to update guests: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
              />
            )}
          </div>

          {/* Guest Work Experience */}
          <EditableGuestExperience
            experiences={episode.guestWorkExperience}
            onSave={handleGuestExperienceUpdate}
          />

          {/* Stats */}
          <div className="mb-8 flex flex-wrap gap-6 border-b border-slate-200 pb-8">
            <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm text-caption font-medium">Word Count</p>
                <p className="text-xl font-bold gradient-text">
                  {episode.wordCount.toLocaleString()}
                </p>
              </div>
            </div>
            {episode.audioLink && (
              <a
                href={episode.audioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Listen to Episode
              </a>
            )}
          </div>

          {/* Transcript */}
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.5, delay: 0.2 }}
          >
            <h2 className="mb-6 text-2xl font-bold gradient-text flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Full Transcript
            </h2>
            <EditableTranscriptViewer
              transcript={episode.transcript}
              maxHeight={500}
              hosts={episode.hosts}
              guests={episode.guests}
              onSave={handleTranscriptUpdate}
            />
          </motion.div>
        </motion.article>
      </main>

      <FloatingButton />
    </motion.div>
    </>
  );
}

