export interface GuestWorkExperience {
  name: string;
  title: string;
  company: string;
}

export interface Episode {
  id: string;
  firestoreId?: string;
  fileName: string;
  date: string;
  series: string;
  episodeNumber: string;
  episodeTitle: string;
  hosts: string[];
  guests: string[];
  guestWorkExperience: GuestWorkExperience[];
  transcript: string;
  audioLink: string;
  wordCount: number;
  extractedAt: string;
  // Optional enhanced fields
  keyTopics?: string[];
  notableQuotes?: string[];
  summary?: string;
  uploadedAt?: string;
}

export interface DashboardStats {
  totalEpisodes: number;
  totalGuests: number;
  totalHosts: number;
  seriesBreakdown: Record<string, number>;
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export interface SearchResult {
  episode: Episode;
  matchType: 'title' | 'guest' | 'host' | 'transcript';
  context?: string;
}

