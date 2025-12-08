'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import EpisodeCard from '@/components/EpisodeCard';
import FloatingButton from '@/components/FloatingButton';
import { Episode, SearchResult } from '@/lib/types';
import { loadEpisodes, searchEpisodes } from '@/lib/data';

export default function SearchPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const searchResults = searchEpisodes(episodes, query);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
            <p className="text-body">Loading podcast data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Search Podcasts</h1>
          <p className="text-lg text-body max-w-2xl mx-auto">
            Search across episode titles, guests, hosts, and transcript content to find exactly what you're looking for
          </p>
        </div>

        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search episodes, guests, hosts, or keywords..."
          />
        </div>

        {searchQuery && (
          <div className="mb-8 text-center">
            <p className="text-body text-lg">
              Found <span className="font-bold gradient-text">{results.length}</span> result
              {results.length !== 1 ? 's' : ''} for <span className="font-semibold text-heading">"{searchQuery}"</span>
            </p>
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-6">
            {results.map((result) => (
              <div
                key={result.episode.id}
                className="card-elevated p-6 glow-card hover:border-blue-300"
              >
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className="inline-block rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-white">
                      {result.episode.series}
                    </span>
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {result.matchType === 'title' && '📝 Title Match'}
                      {result.matchType === 'guest' && '👤 Guest Match'}
                      {result.matchType === 'host' && '🎙️ Host Match'}
                      {result.matchType === 'transcript' && '📄 Transcript Match'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-heading hover:gradient-text transition-all">
                    {result.episode.episodeTitle}
                  </h3>
                </div>

                <p className="mb-3 text-sm text-caption font-medium">
                  {new Date(result.episode.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>

                {result.episode.guests.length > 0 && (
                  <p className="mb-4 text-sm text-body">
                    <span className="font-semibold text-heading">Guests:</span>{' '}
                    {result.episode.guests.join(', ')}
                  </p>
                )}

                {result.context && (
                  <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <p className="text-sm text-body italic leading-relaxed">
                      "{result.context}"
                    </p>
                  </div>
                )}

                <a
                  href={`/episodes/${result.episode.id}`}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  View Episode
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="card-elevated p-12 text-center">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-heading mb-2">
              No results found
            </h3>
            <p className="text-body mb-4">
              We couldn't find any episodes matching your search. Try different keywords or check your spelling.
            </p>
          </div>
        ) : (
          <div className="card-elevated p-12 text-center">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-heading mb-2">
              Start your search
            </h3>
            <p className="text-body">
              Enter keywords, guest names, or topics to discover relevant podcast episodes
            </p>
          </div>
        )}
      </main>

      <FloatingButton />
    </div>
  );
}

