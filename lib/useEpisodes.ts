/**
 * Custom hook for loading episodes with enhanced error handling and loading states
 */

import { useState, useEffect } from 'react';
import { Episode } from './types';
import { loadEpisodes } from './data';

export interface UseEpisodesResult {
  episodes: Episode[];
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

/**
 * Hook to load episodes with loading and error states
 */
export function useEpisodes(): UseEpisodesResult {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchEpisodes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await loadEpisodes();
        
        if (isMounted) {
          setEpisodes(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load episodes'));
          setLoading(false);
        }
      }
    };

    fetchEpisodes();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  const retry = () => {
    setRetryCount(prev => prev + 1);
  };

  return {
    episodes,
    loading,
    error,
    retry,
  };
}

