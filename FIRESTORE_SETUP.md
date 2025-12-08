# Firestore Integration Guide

This guide explains how to use the Firestore integration for the Podcast Web Application.

## 📋 Overview

The application now supports loading podcast data from Firebase Firestore with the following features:

- ✅ **Firestore Integration**: Episodes stored in Cloud Firestore
- ✅ **Client-side Caching**: 5-minute cache to reduce Firestore reads
- ✅ **Automatic Fallback**: Falls back to JSON if Firestore fails
- ✅ **Batch Import**: Efficient batch writes for data import
- ✅ **Error Handling**: Comprehensive error handling and retry logic
- ✅ **Loading States**: Enhanced loading states across components

## 🗂️ Firestore Structure

### Collection: `episodes`

Each document in the `episodes` collection has the following structure:

```typescript
{
  id: string;                    // Document ID (same as episode ID)
  fileName: string;
  date: string;                  // YYYY-MM-DD format
  series: string;                // e.g., "CLS", "PULSE", "MBS"
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
  extractedAt: string;           // ISO timestamp
  keyTopics?: string[];          // Optional
  notableQuotes?: string[];      // Optional
  summary?: string;              // Optional
  uploadedAt?: string;           // ISO timestamp (added during import)
}
```

## 🚀 Getting Started

### 1. Import Data to Firestore

Run the import script to upload your JSON data to Firestore:

```bash
npm run import-firestore
```

This script will:
- Read data from `public/data/extracted_data.json`
- Upload episodes to Firestore in batches (500 per batch)
- Display a summary of imported data
- Overwrite existing documents with the same ID

**Expected Output:**
```
🚀 Starting Firestore import process...

✓ Loaded 5 episodes from JSON file

============================================================
IMPORT SUMMARY
============================================================
Total Episodes: 5
Unique Hosts: 8
Unique Guests: 4

Episodes by Series:
  - CLS: 1
  - PULSE: 1
  - MBS: 1
  - NIH: 1
  - Present: 1
============================================================

Uploading 5 episodes in 1 batch(es)...

Batch 1/1: Processing episodes 1 to 5
✓ Batch 1 committed successfully

✅ Import completed successfully!

All 5 episodes have been uploaded to Firestore.
Collection: episodes
Project: podcast-database-3c8ad
```

### 2. Configure Data Source

The application is configured to use Firestore by default. You can toggle between Firestore and JSON in `lib/data.ts`:

```typescript
// Set to true to use Firestore, false to use JSON
const USE_FIRESTORE = true;
```

### 3. Verify the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Check the browser console for loading messages:
   - `✓ Loaded X episodes from Firestore` - Data loaded from Firestore
   - `✓ Loaded X episodes from JSON` - Fallback to JSON
   - `✓ Returning cached episodes` - Data served from cache

## 🔧 Configuration

### Cache Duration

Modify the cache duration in `lib/data.ts`:

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (in milliseconds)
```

### Firestore Indexes

For optimal query performance, create the following index in Firebase Console:

**Collection:** `episodes`
**Fields:**
- `date` (Descending)

To create the index:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `podcast-database-3c8ad`
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Add the fields as specified above

## 📊 Performance Optimization

### Caching Strategy

The application implements a multi-level caching strategy:

1. **In-Memory Cache**: Episodes are cached in memory for 5 minutes
2. **Cache Validation**: Automatic cache invalidation after timeout
3. **Manual Cache Clear**: Use `clearCache()` function to force refresh

```typescript
import { clearCache } from '@/lib/data';

// Clear cache and force reload
clearCache();
const episodes = await loadEpisodes();
```

### Firestore Read Optimization

- **Batch Reads**: All episodes loaded in a single query
- **Ordered Results**: Pre-sorted by date (descending)
- **Client-side Filtering**: Search and filter operations done client-side
- **Minimal Reads**: Cache reduces Firestore reads by ~95%

### Cost Estimation

With 5-minute caching:
- **Without Cache**: ~1,200 reads/hour (1 read per page load)
- **With Cache**: ~12 reads/hour (1 read per 5 minutes)
- **Monthly Savings**: ~850,000 reads/month

Firestore free tier: 50,000 reads/day (1.5M reads/month)

## 🛠️ Troubleshooting

### Issue: "Failed to load episodes from Firestore"

**Possible Causes:**
1. Firebase configuration incorrect
2. Firestore rules blocking access
3. Network connectivity issues

**Solutions:**
1. Verify Firebase config in `lib/firebase.ts`
2. Check Firestore security rules
3. Check browser console for detailed error messages
4. Application will automatically fallback to JSON

### Issue: "No data displayed"

**Possible Causes:**
1. Data not imported to Firestore
2. Collection name mismatch

**Solutions:**
1. Run `npm run import-firestore` to import data
2. Verify collection name is `episodes` in Firestore Console

### Issue: "Too many Firestore reads"

**Possible Causes:**
1. Cache not working
2. Multiple components calling `loadEpisodes()`

**Solutions:**
1. Check cache duration setting
2. Use the `useEpisodes` hook for consistent caching
3. Monitor Firestore usage in Firebase Console

## 🔐 Security Rules

Current Firestore security rules (already configured):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /episodes/{episode} {
      allow read: if true;  // Public read access
      allow write: if false; // No client-side writes
    }
  }
}
```

**Note:** Write operations should only be done through the import script or Firebase Console.

## 📝 Best Practices

1. **Import Data**: Always use the import script for bulk uploads
2. **Cache Management**: Don't clear cache unnecessarily
3. **Error Handling**: Always handle loading and error states in components
4. **Monitoring**: Regularly check Firestore usage in Firebase Console
5. **Fallback**: Keep JSON file updated as a fallback option

## 🔄 Updating Data

To update the Firestore data:

1. Update the JSON file: `public/data/extracted_data.json`
2. Run the import script: `npm run import-firestore`
3. Clear browser cache or wait for cache timeout

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Pricing](https://firebase.google.com/pricing)

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Review this guide's troubleshooting section
3. Verify Firebase configuration and security rules
4. Check Firestore Console for data integrity

