/**
 * Script to import podcast data from JSON file to Firestore
 * 
 * This script reads the extracted_data.json file and uploads all episodes
 * to Firestore using batch writes for efficiency.
 * 
 * Usage: npx tsx scripts/importToFirestore.ts
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  writeBatch,
  doc,
  getDocs,
  query
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: "podcast-database-3c8ad.firebaseapp.com",
  projectId: "podcast-database-3c8ad",
  storageBucket: "podcast-database-3c8ad.firebasestorage.app",
  messagingSenderId: "912748695210",
  appId: "1:912748695210:web:376a8a786eaae6fb370ad3",
  measurementId: "G-R8GF251W72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection name for episodes
const COLLECTION_NAME = 'episodes';

// Firestore batch write limit is 500 operations
const BATCH_SIZE = 500;

interface Episode {
  id: string;
  fileName: string;
  date: string;
  series: string;
  episodeNumber: string;
  episodeTitle: string;
  hosts: string[];
  guests: string[];
  guestWorkExperience: Array<{
    name: string;
    title: string;
    company: string;
  }>;
  transcript: string;
  audioLink: string;
  wordCount: number;
  extractedAt: string;
  keyTopics?: string[];
  notableQuotes?: string[];
  summary?: string;
}

/**
 * Load episodes from JSON file
 */
function loadEpisodesFromJSON(): Episode[] {
  const jsonPath = path.join(process.cwd(), 'public', 'data', 'extracted_data.json');

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found at: ${jsonPath}`);
  }

  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const episodes: Episode[] = JSON.parse(jsonData);

  console.log(`✓ Loaded ${episodes.length} episodes from JSON file`);
  return episodes;
}

/**
 * Check if collection already has data
 */
async function checkExistingData(): Promise<number> {
  const episodesRef = collection(db, COLLECTION_NAME);
  const q = query(episodesRef);
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Upload episodes to Firestore in batches
 */
async function uploadEpisodes(episodes: Episode[]): Promise<void> {
  const totalEpisodes = episodes.length;
  const batches = Math.ceil(totalEpisodes / BATCH_SIZE);

  console.log(`\nUploading ${totalEpisodes} episodes in ${batches} batch(es)...`);

  for (let i = 0; i < batches; i++) {
    const batch = writeBatch(db);
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, totalEpisodes);
    const batchEpisodes = episodes.slice(start, end);

    console.log(`\nBatch ${i + 1}/${batches}: Processing episodes ${start + 1} to ${end}`);

    batchEpisodes.forEach((episode) => {
      const docRef = doc(db, COLLECTION_NAME, episode.id);
      batch.set(docRef, {
        ...episode,
        // Add server timestamp for tracking
        uploadedAt: new Date().toISOString(),
      });
    });

    try {
      await batch.commit();
      console.log(`✓ Batch ${i + 1} committed successfully`);
    } catch (error) {
      console.error(`✗ Error committing batch ${i + 1}:`, error);
      throw error;
    }
  }
}

/**
 * Display summary statistics
 */
function displaySummary(episodes: Episode[]): void {
  const seriesCount = new Map<string, number>();
  const totalHosts = new Set<string>();
  const totalGuests = new Set<string>();

  episodes.forEach((episode) => {
    // Count series
    const series = episode.series || 'Unknown';
    seriesCount.set(series, (seriesCount.get(series) || 0) + 1);

    // Count unique hosts and guests
    episode.hosts.forEach(host => totalHosts.add(host));
    episode.guests.forEach(guest => totalGuests.add(guest));
  });

  console.log('\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Episodes: ${episodes.length}`);
  console.log(`Unique Hosts: ${totalHosts.size}`);
  console.log(`Unique Guests: ${totalGuests.size}`);
  console.log('\nEpisodes by Series:');

  Array.from(seriesCount.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([series, count]) => {
      console.log(`  - ${series}: ${count}`);
    });

  console.log('='.repeat(60) + '\n');
}

/**
 * Main import function
 */
async function main() {
  try {
    console.log('🚀 Starting Firestore import process...\n');

    // Check if data already exists
    const existingCount = await checkExistingData();
    if (existingCount > 0) {
      console.log(`⚠️  Warning: Collection '${COLLECTION_NAME}' already contains ${existingCount} documents.`);
      console.log('This script will overwrite existing documents with the same ID.\n');
    }

    // Load episodes from JSON
    const episodes = loadEpisodesFromJSON();

    // Display summary before upload
    displaySummary(episodes);

    // Upload to Firestore
    await uploadEpisodes(episodes);

    console.log('\n✅ Import completed successfully!');
    console.log(`\nAll ${episodes.length} episodes have been uploaded to Firestore.`);
    console.log(`Collection: ${COLLECTION_NAME}`);
    console.log(`Project: ${firebaseConfig.projectId}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();

