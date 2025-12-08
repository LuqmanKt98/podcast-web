import { Episode, DashboardStats, SearchResult } from './types';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Cache configuration
let cachedEpisodes: Episode[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Flag to determine data source (can be toggled for testing)
const USE_FIRESTORE = true;

/**
 * Load episodes from Firestore with caching
 */
async function loadEpisodesFromFirestore(): Promise<Episode[]> {
  try {
    const episodesRef = collection(db, 'episodes');
    const q = query(episodesRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    const episodes: Episode[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      episodes.push({
        ...data,
        id: data.id || doc.id,
        firestoreId: doc.id,
      } as Episode);
    });

    console.log(`✓ Loaded ${episodes.length} episodes from Firestore`);
    return episodes;
  } catch (error) {
    console.error('Error loading episodes from Firestore:', error);
    throw error;
  }
}

/**
 * Load episodes from JSON file (fallback method)
 */
async function loadEpisodesFromJSON(): Promise<Episode[]> {
  try {
    const response = await fetch('/data/extracted_data.json');
    if (!response.ok) {
      throw new Error('Failed to load episodes from JSON');
    }
    const data = await response.json();
    console.log(`✓ Loaded ${data.length} episodes from JSON`);
    return data;
  } catch (error) {
    console.error('Error loading episodes from JSON:', error);
    throw error;
  }
}

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  if (!cachedEpisodes || !cacheTimestamp) {
    return false;
  }
  const now = Date.now();
  return (now - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Main function to load episodes with caching and fallback
 */
export async function loadEpisodes(): Promise<Episode[]> {
  // Return cached data if valid
  if (isCacheValid()) {
    console.log('✓ Returning cached episodes');
    return cachedEpisodes!;
  }

  try {
    let episodes: Episode[];

    if (USE_FIRESTORE) {
      try {
        // Try loading from Firestore first
        episodes = await loadEpisodesFromFirestore();
      } catch (firestoreError) {
        console.warn('Firestore failed, falling back to JSON:', firestoreError);
        // Fallback to JSON if Firestore fails
        episodes = await loadEpisodesFromJSON();
      }
    } else {
      // Use JSON directly if Firestore is disabled
      episodes = await loadEpisodesFromJSON();
    }

    // Update cache
    cachedEpisodes = episodes;
    cacheTimestamp = Date.now();

    return episodes;
  } catch (error) {
    console.error('Error loading episodes:', error);
    // Return empty array as last resort
    return [];
  }
}

/**
 * Clear the cache (useful for forcing a refresh)
 */
export function clearCache(): void {
  cachedEpisodes = null;
  cacheTimestamp = null;
  console.log('✓ Cache cleared');
}

export function calculateStats(episodes: Episode[]): DashboardStats {
  const seriesBreakdown: Record<string, number> = {};
  const allGuests = new Set<string>();
  const allHosts = new Set<string>();
  const dates: string[] = [];

  episodes.forEach((episode) => {
    // Series breakdown - handle empty series
    const series = episode.series || 'Unknown';
    seriesBreakdown[series] = (seriesBreakdown[series] || 0) + 1;

    // Guests and hosts - handle undefined arrays
    const guests = episode.guests || [];
    const hosts = episode.hosts || [];
    guests.forEach((guest) => allGuests.add(guest));
    hosts.forEach((host) => allHosts.add(host));

    // Dates
    if (episode.date) {
      dates.push(episode.date);
    }
  });

  dates.sort();

  return {
    totalEpisodes: episodes.length,
    totalGuests: allGuests.size,
    totalHosts: allHosts.size,
    seriesBreakdown,
    dateRange: {
      earliest: dates[0] || 'N/A',
      latest: dates[dates.length - 1] || 'N/A',
    },
  };
}

export function searchEpisodes(
  episodes: Episode[],
  query: string
): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  episodes.forEach((episode) => {
    // Search in title
    if (episode.episodeTitle.toLowerCase().includes(lowerQuery)) {
      if (!seen.has(episode.id)) {
        results.push({
          episode,
          matchType: 'title',
        });
        seen.add(episode.id);
      }
    }

    // Search in guests
    episode.guests.forEach((guest) => {
      if (guest.toLowerCase().includes(lowerQuery)) {
        if (!seen.has(episode.id)) {
          results.push({
            episode,
            matchType: 'guest',
          });
          seen.add(episode.id);
        }
      }
    });

    // Search in hosts
    episode.hosts.forEach((host) => {
      if (host.toLowerCase().includes(lowerQuery)) {
        if (!seen.has(episode.id)) {
          results.push({
            episode,
            matchType: 'host',
          });
          seen.add(episode.id);
        }
      }
    });

    // Search in transcript
    if (episode.transcript.toLowerCase().includes(lowerQuery)) {
      if (!seen.has(episode.id)) {
        const index = episode.transcript.toLowerCase().indexOf(lowerQuery);
        const start = Math.max(0, index - 50);
        const end = Math.min(episode.transcript.length, index + 100);
        const context = episode.transcript.substring(start, end).trim();

        results.push({
          episode,
          matchType: 'transcript',
          context: `...${context}...`,
        });
        seen.add(episode.id);
      }
    }
  });

  return results;
}

export function filterEpisodes(
  episodes: Episode[],
  filters: {
    series?: string;
    host?: string;
    guest?: string;
    startDate?: string;
    endDate?: string;
  }
): Episode[] {
  return episodes.filter((episode) => {
    const series = episode.series || 'Unknown';
    const hosts = episode.hosts || [];
    const guests = episode.guests || [];
    
    if (filters.series && series !== filters.series) {
      return false;
    }
    if (filters.host && !hosts.includes(filters.host)) {
      return false;
    }
    if (filters.guest && !guests.includes(filters.guest)) {
      return false;
    }
    if (filters.startDate && episode.date && episode.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && episode.date && episode.date > filters.endDate) {
      return false;
    }
    return true;
  });
}

export function sortEpisodes(
  episodes: Episode[],
  sortBy: 'date-desc' | 'date-asc' | 'title'
): Episode[] {
  const sorted = [...episodes];
  switch (sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'title':
      sorted.sort((a, b) => a.episodeTitle.localeCompare(b.episodeTitle));
      break;
  }
  return sorted;
}

