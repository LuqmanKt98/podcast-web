# Implementation Examples

This document provides examples of how to use the new Firestore integration in your components.

## Using the `useEpisodes` Hook

The `useEpisodes` hook provides a clean way to load episodes with built-in loading and error states.

### Basic Usage

```typescript
'use client';

import { useEpisodes } from '@/lib/useEpisodes';
import ErrorMessage from '@/components/ErrorMessage';
import SkeletonLoader from '@/components/SkeletonLoader';
import EpisodeCard from '@/components/EpisodeCard';

export default function MyComponent() {
  const { episodes, loading, error, retry } = useEpisodes();

  if (loading) {
    return <SkeletonLoader type="card" count={6} />;
  }

  if (error) {
    return <ErrorMessage message={error.message} onRetry={retry} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {episodes.map((episode) => (
        <EpisodeCard key={episode.id} episode={episode} />
      ))}
    </div>
  );
}
```

## Using `loadEpisodes` Directly

If you prefer to use the `loadEpisodes` function directly:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { loadEpisodes } from '@/lib/data';
import { Episode } from '@/lib/types';

export default function MyComponent() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadEpisodes();
        setEpisodes(data);
      } catch (error) {
        console.error('Error loading episodes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ... rest of component
}
```

## Clearing Cache

To force a refresh of the data:

```typescript
import { clearCache, loadEpisodes } from '@/lib/data';

async function refreshData() {
  clearCache();
  const freshData = await loadEpisodes();
  return freshData;
}
```

## Error Handling Example

```typescript
'use client';

import { useState } from 'react';
import { useEpisodes } from '@/lib/useEpisodes';
import ErrorMessage from '@/components/ErrorMessage';

export default function EpisodesWithErrorHandling() {
  const { episodes, loading, error, retry } = useEpisodes();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    retry();
  };

  if (error) {
    return (
      <ErrorMessage 
        message={
          retryCount > 2 
            ? "We're having trouble loading the data. Please try again later."
            : error.message
        }
        onRetry={handleRetry}
      />
    );
  }

  // ... rest of component
}
```

## Updating Existing Components

### Before (JSON only):

```typescript
// app/episodes/page.tsx
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
```

### After (with Firestore and better error handling):

```typescript
// app/episodes/page.tsx
import { useEpisodes } from '@/lib/useEpisodes';
import ErrorMessage from '@/components/ErrorMessage';

export default function EpisodesPage() {
  const { episodes, loading, error, retry } = useEpisodes();
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    setFilteredEpisodes(episodes);
  }, [episodes]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12">
          <ErrorMessage message={error.message} onRetry={retry} />
        </main>
      </div>
    );
  }

  // ... rest of component
}
```

## Performance Monitoring

Add logging to monitor cache performance:

```typescript
import { loadEpisodes } from '@/lib/data';

async function loadWithMonitoring() {
  const startTime = performance.now();
  const episodes = await loadEpisodes();
  const endTime = performance.now();
  
  console.log(`Loaded ${episodes.length} episodes in ${endTime - startTime}ms`);
  
  return episodes;
}
```

## Testing Firestore vs JSON

Toggle between data sources for testing:

```typescript
// In lib/data.ts
const USE_FIRESTORE = process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true';
```

Then in `.env.local`:
```
NEXT_PUBLIC_USE_FIRESTORE=true
```

## Advanced: Custom Cache Duration

Create a custom hook with configurable cache:

```typescript
import { useState, useEffect } from 'react';
import { Episode } from './types';
import { loadEpisodes, clearCache } from './data';

export function useEpisodesWithCustomCache(cacheDuration: number = 5 * 60 * 1000) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    const now = Date.now();
    const shouldRefetch = now - lastFetch > cacheDuration;

    if (shouldRefetch) {
      const fetchEpisodes = async () => {
        setLoading(true);
        clearCache();
        const data = await loadEpisodes();
        setEpisodes(data);
        setLastFetch(Date.now());
        setLoading(false);
      };

      fetchEpisodes();
    }
  }, [cacheDuration, lastFetch]);

  return { episodes, loading };
}
```

## Firestore Query Examples

For future enhancements, here are some useful Firestore queries:

### Filter by Series

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

async function getEpisodesBySeries(series: string) {
  const q = query(
    collection(db, 'episodes'),
    where('series', '==', series)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Filter by Date Range

```typescript
async function getEpisodesByDateRange(startDate: string, endDate: string) {
  const q = query(
    collection(db, 'episodes'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Pagination

```typescript
import { limit, startAfter, DocumentSnapshot } from 'firebase/firestore';

async function getEpisodesPaginated(pageSize: number, lastDoc?: DocumentSnapshot) {
  let q = query(
    collection(db, 'episodes'),
    orderBy('date', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  return {
    episodes: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
}
```

## Best Practices

1. **Always handle loading states**: Use skeleton loaders for better UX
2. **Always handle errors**: Provide retry functionality
3. **Use the hook**: Prefer `useEpisodes` over direct `loadEpisodes` calls
4. **Monitor performance**: Log cache hits and misses in development
5. **Test both sources**: Verify both Firestore and JSON fallback work
6. **Keep JSON updated**: Maintain JSON as a reliable fallback

