'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import { Episode } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { parseFilename, extractFromText } from '@/lib/extractData';

// Processing status for each file
interface FileProcessingStatus {
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'needs_review' | 'skipped';
  progress: number;
  error?: string;
  data?: Episode;
  issues?: string[];
}

// Batch processing statistics
interface BatchStats {
  total: number;
  completed: number;
  failed: number;
  needsReview: number;
  skipped: number;
  inProgress: boolean;
  currentFile: string;
  startTime?: number;
  estimatedTimeRemaining?: string;
}

export default function ExtractPage() {
  // Single file mode states
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<Episode | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk processing states
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [processingQueue, setProcessingQueue] = useState<FileProcessingStatus[]>([]);
  const [batchStats, setBatchStats] = useState<BatchStats>({
    total: 0,
    completed: 0,
    failed: 0,
    needsReview: 0,
    skipped: 0,
    inProgress: false,
    currentFile: '',
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewingFile, setReviewingFile] = useState<FileProcessingStatus | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate if episode data is complete
  const validateEpisodeData = (data: Episode): { isComplete: boolean; issues: string[] } => {
    const issues: string[] = [];

    if (!data.date) issues.push('Missing date');
    if (!data.episodeTitle || data.episodeTitle.trim() === '') issues.push('Missing episode title');
    if (!data.series || data.series.trim() === '') issues.push('Missing series name');
    if (!data.hosts || data.hosts.length === 0) issues.push('No hosts identified');
    if (!data.transcript || data.transcript.trim().length < 100) issues.push('Transcript too short or missing');

    return {
      isComplete: issues.length === 0,
      issues,
    };
  };

  // Extract text from file
  const extractTextFromFile = async (file: File): Promise<{ text: string; title?: string }> => {
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      const mammoth = (await import('mammoth')).default;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { text: result.value, title: file.name.replace(/\.(docx?|doc)$/i, '') };
    } else {
      return { text: await file.text() };
    }
  };

  // Extract data using AI
  const extractWithAI = async (text: string, filename: string, docTitle?: string): Promise<Episode> => {
    const fileInfo = parseFilename(filename);
    const basicInfo = extractFromText(text);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, docTitle }),
      });

      if (!response.ok) throw new Error('API failed');
      const aiData = await response.json();

      return {
        id: `${aiData.date || fileInfo.date}-${fileInfo.series}-${fileInfo.episodeNumber}`,
        fileName: filename.replace(/\.(docx?|txt|pdf)$/i, ''),
        date: aiData.date || fileInfo.date || '',
        series: fileInfo.series || aiData.series || '',
        episodeNumber: fileInfo.episodeNumber || aiData.episodeNumber || '',
        episodeTitle: aiData.episodeTitle || basicInfo.episodeTitle || '',
        hosts: aiData.hosts?.length ? aiData.hosts : basicInfo.hosts,
        guests: aiData.guests?.length ? aiData.guests : basicInfo.guests,
        guestWorkExperience: aiData.guestWorkExperience || [],
        transcript: aiData.transcript || text,
        audioLink: '',
        wordCount: text.split(/\s+/).length,
        extractedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: `${fileInfo.date}-${fileInfo.series}-${fileInfo.episodeNumber}`,
        fileName: filename.replace(/\.(docx?|txt|pdf)$/i, ''),
        date: fileInfo.date || '',
        series: fileInfo.series,
        episodeNumber: fileInfo.episodeNumber,
        episodeTitle: basicInfo.episodeTitle,
        hosts: basicInfo.hosts,
        guests: basicInfo.guests,
        guestWorkExperience: [],
        transcript: text,
        audioLink: '',
        wordCount: text.split(/\s+/).length,
        extractedAt: new Date().toISOString(),
      };
    }
  };

  // Check if episode already exists in Firestore
  const checkIfEpisodeExists = async (fileName: string): Promise<boolean> => {
    try {
      // Check by fileName field
      const episodesRef = collection(db, 'episodes');
      const q = query(episodesRef, where('fileName', '==', fileName.replace(/\.(docx?|txt|pdf)$/i, '')));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking for duplicate:', error);
      return false; // If check fails, assume it doesn't exist
    }
  };

  // Save episode to Firebase (with duplicate check)
  const saveToFirebase = async (data: Episode, skipDuplicateCheck = false): Promise<{ success: boolean; isDuplicate: boolean }> => {
    try {
      // Check for duplicate first
      if (!skipDuplicateCheck) {
        const exists = await checkIfEpisodeExists(data.fileName);
        if (exists) {
          return { success: false, isDuplicate: true };
        }
      }

      await addDoc(collection(db, 'episodes'), data);
      return { success: true, isDuplicate: false };
    } catch (error) {
      console.error('Save error:', error);
      return { success: false, isDuplicate: false };
    }
  };

  // Process a single file in bulk mode
  const processSingleFile = async (
    file: File,
    index: number,
    total: number
  ): Promise<FileProcessingStatus> => {
    const status: FileProcessingStatus = {
      fileName: file.name,
      status: 'processing',
      progress: 0,
    };

    try {
      // Step 1: Extract text (20% progress)
      status.progress = 10;
      const { text, title } = await extractTextFromFile(file);
      status.progress = 20;

      // Step 2: AI extraction (60% progress)
      const data = await extractWithAI(text, file.name, title);
      status.progress = 60;
      status.data = data;

      // Step 3: Validate data (70% progress)
      const validation = validateEpisodeData(data);
      status.progress = 70;

      if (!validation.isComplete) {
        // Flag for manual review
        status.status = 'needs_review';
        status.issues = validation.issues;
        status.progress = 100;
        return status;
      }

      // Step 4: Check for duplicate and Save to Firebase (100% progress)
      const result = await saveToFirebase(data);
      status.progress = 100;

      if (result.isDuplicate) {
        status.status = 'skipped';
        status.error = 'Already exists in database';
      } else if (result.success) {
        status.status = 'completed';
      } else {
        status.status = 'failed';
        status.error = 'Failed to save to database';
      }

      return status;
    } catch (error) {
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      status.progress = 100;
      return status;
    }
  };

  // Calculate estimated time remaining
  const calculateETA = (completed: number, total: number, startTime: number): string => {
    if (completed === 0) return 'Calculating...';

    const elapsed = Date.now() - startTime;
    const avgTimePerFile = elapsed / completed;
    const remaining = (total - completed) * avgTimePerFile;

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `~${hours}h ${minutes % 60}m remaining`;
    }
    return `~${minutes}m ${seconds}s remaining`;
  };

  // Start bulk processing
  const startBulkProcessing = async () => {
    if (bulkFiles.length === 0) {
      toast.error('No files selected');
      return;
    }

    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    // Initialize processing queue
    const initialQueue: FileProcessingStatus[] = bulkFiles.map(file => ({
      fileName: file.name,
      status: 'pending',
      progress: 0,
    }));
    setProcessingQueue(initialQueue);

    setBatchStats({
      total: bulkFiles.length,
      completed: 0,
      failed: 0,
      needsReview: 0,
      skipped: 0,
      inProgress: true,
      currentFile: '',
      startTime,
    });

    let completed = 0;
    let failed = 0;
    let needsReview = 0;
    let skipped = 0;

    // Process files sequentially
    for (let i = 0; i < bulkFiles.length; i++) {
      // Check for pause or abort
      if (isPaused) {
        await new Promise<void>(resolve => {
          const checkPause = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPause);
              resolve();
            }
          }, 100);
        });
      }

      if (abortControllerRef.current?.signal.aborted) {
        break;
      }

      const file = bulkFiles[i];

      // Update current file being processed
      setBatchStats(prev => ({
        ...prev,
        currentFile: file.name,
        estimatedTimeRemaining: calculateETA(completed, bulkFiles.length, startTime),
      }));

      // Update queue status
      setProcessingQueue(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'processing' } : item
      ));

      // Process the file
      const result = await processSingleFile(file, i, bulkFiles.length);

      // Update queue with result
      setProcessingQueue(prev => prev.map((item, idx) =>
        idx === i ? result : item
      ));

      // Update stats
      if (result.status === 'completed') {
        completed++;
      } else if (result.status === 'failed') {
        failed++;
      } else if (result.status === 'needs_review') {
        needsReview++;
      } else if (result.status === 'skipped') {
        skipped++;
      }

      setBatchStats(prev => ({
        ...prev,
        completed,
        failed,
        needsReview,
        skipped,
        estimatedTimeRemaining: calculateETA(completed + failed + needsReview + skipped, bulkFiles.length, startTime),
      }));

      // Small delay between files to prevent API rate limiting
      if (i < bulkFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Processing complete
    setBatchStats(prev => ({
      ...prev,
      inProgress: false,
      currentFile: '',
    }));

    const totalProcessed = completed + failed + needsReview + skipped;
    toast.success(`Bulk processing complete: ${completed} saved, ${skipped} skipped (duplicates), ${needsReview} need review, ${failed} failed`);
  };

  // Handle bulk file selection
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        f => f.name.endsWith('.docx') || f.name.endsWith('.doc') || f.name.endsWith('.txt')
      );
      setBulkFiles(files);
      setProcessingQueue([]);
      setBatchStats({
        total: files.length,
        completed: 0,
        failed: 0,
        needsReview: 0,
        skipped: 0,
        inProgress: false,
        currentFile: '',
      });
      toast.success(`${files.length} files selected`);
    }
  };

  // Stop bulk processing
  const stopProcessing = () => {
    abortControllerRef.current?.abort();
    setBatchStats(prev => ({ ...prev, inProgress: false }));
    toast('Processing stopped');
  };

  // Handle review and save
  const handleReviewSave = async () => {
    if (!reviewingFile?.data) return;

    const validation = validateEpisodeData(reviewingFile.data);
    if (!validation.isComplete) {
      toast.error(`Still missing: ${validation.issues.join(', ')}`);
      return;
    }

    setSaving(true);
    const saved = await saveToFirebase(reviewingFile.data);
    setSaving(false);

    if (saved) {
      // Update queue status
      setProcessingQueue(prev => prev.map(item =>
        item.fileName === reviewingFile.fileName
          ? { ...item, status: 'completed', issues: [] }
          : item
      ));
      setBatchStats(prev => ({
        ...prev,
        needsReview: prev.needsReview - 1,
        completed: prev.completed + 1,
      }));
      toast.success('Saved successfully!');
      setReviewingFile(null);
    } else {
      toast.error('Failed to save');
    }
  };

  // Single file handlers (original functionality)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedData(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setExtracting(true);
    try {
      const { text, title } = await extractTextFromFile(file);
      const data = await extractWithAI(text, file.name, title);
      setExtractedData(data);
      toast.success('Data extracted successfully!');
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract data');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData) return;

    if (!extractedData.date) {
      toast.error('Date is required');
      return;
    }

    if (!extractedData.episodeTitle) {
      toast.error('Episode title is required');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'episodes'), extractedData);
      toast.success('Episode saved successfully!');
      setFile(null);
      setExtractedData(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save episode');
    } finally {
      setSaving(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'needs_review': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'skipped': return 'bg-purple-500';
      default: return 'bg-gray-300';
    }
  };

  // Export review files report to text file
  const exportReviewReport = () => {
    const reviewFiles = processingQueue.filter(item => item.status === 'needs_review');

    if (reviewFiles.length === 0) {
      toast.error('No review files to export');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let reportContent = `PODCAST EXTRACTION REVIEW REPORT\n`;
    reportContent += `Generated: ${new Date().toLocaleString()}\n`;
    reportContent += `Total Files Needing Review: ${reviewFiles.length}\n`;
    reportContent += `${'='.repeat(60)}\n\n`;

    reviewFiles.forEach((item, index) => {
      reportContent += `${index + 1}. FILE: ${item.fileName}\n`;
      reportContent += `   Status: Needs Manual Review\n`;
      reportContent += `   Issues:\n`;
      if (item.issues && item.issues.length > 0) {
        item.issues.forEach(issue => {
          reportContent += `      - ${issue}\n`;
        });
      } else {
        reportContent += `      - Unknown issue\n`;
      }
      if (item.data) {
        reportContent += `   Extracted Data:\n`;
        reportContent += `      - Date: ${item.data.date || 'MISSING'}\n`;
        reportContent += `      - Series: ${item.data.series || 'MISSING'}\n`;
        reportContent += `      - Episode #: ${item.data.episodeNumber || 'MISSING'}\n`;
        reportContent += `      - Title: ${item.data.episodeTitle || 'MISSING'}\n`;
        reportContent += `      - Hosts: ${item.data.hosts?.join(', ') || 'NONE'}\n`;
        reportContent += `      - Guests: ${item.data.guests?.join(', ') || 'NONE'}\n`;
        reportContent += `      - Word Count: ${item.data.wordCount || 0}\n`;
      }
      reportContent += `${'-'.repeat(60)}\n\n`;
    });

    reportContent += `\nEND OF REPORT\n`;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `review-report-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${reviewFiles.length} files to review report`);
  };

  // Save all review files to Firebase (even with missing data)
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSaveProgress, setBulkSaveProgress] = useState({ current: 0, total: 0 });

  const saveAllReviewFiles = async () => {
    const reviewFiles = processingQueue.filter(item => item.status === 'needs_review' && item.data);

    if (reviewFiles.length === 0) {
      toast.error('No review files with data to save');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to save ${reviewFiles.length} files to Firebase?\n\nNote: These files have incomplete data and will be saved as-is.`
    );

    if (!confirmed) return;

    setBulkSaving(true);
    setBulkSaveProgress({ current: 0, total: reviewFiles.length });

    let saved = 0;
    let failed = 0;

    for (let i = 0; i < reviewFiles.length; i++) {
      const item = reviewFiles[i];
      if (item.data) {
        try {
          await addDoc(collection(db, 'episodes'), item.data);
          saved++;

          // Update queue status to completed
          setProcessingQueue(prev => prev.map(queueItem =>
            queueItem.fileName === item.fileName
              ? { ...queueItem, status: 'completed', issues: [] }
              : queueItem
          ));
        } catch (error) {
          console.error(`Failed to save ${item.fileName}:`, error);
          failed++;
        }
      }
      setBulkSaveProgress({ current: i + 1, total: reviewFiles.length });
    }

    // Update batch stats
    setBatchStats(prev => ({
      ...prev,
      completed: prev.completed + saved,
      needsReview: prev.needsReview - saved,
    }));

    setBulkSaving(false);
    toast.success(`Saved ${saved} files to Firebase${failed > 0 ? `, ${failed} failed` : ''}`);
  };

  // Get items that need review
  const reviewItems = processingQueue.filter(item => item.status === 'needs_review');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-bold gradient-text mb-8">Extract Episode Data</h1>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setMode('single')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'single'
              ? 'gradient-primary text-white shadow-lg'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
              }`}
          >
            📄 Single File
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${mode === 'bulk'
              ? 'gradient-primary text-white shadow-lg'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300'
              }`}
          >
            📚 Bulk Processing
          </button>
        </div>

        {/* Single File Mode */}
        {mode === 'single' && (
          <>
            <div className="card-elevated p-8 mb-6">
              <label className="block mb-4">
                <span className="text-lg font-semibold mb-2 block">Upload File</span>
                <input
                  type="file"
                  accept=".doc,.docx,.txt,.pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>

              {file && (
                <button
                  onClick={handleExtract}
                  disabled={extracting}
                  className="btn-primary w-full"
                >
                  {extracting ? 'Extracting...' : 'Extract Data'}
                </button>
              )}
            </div>

            {extractedData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-8">
                <h2 className="text-2xl font-bold mb-6">Edit Extracted Data</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Episode Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={extractedData.episodeTitle}
                      onChange={(e) => setExtractedData({ ...extractedData, episodeTitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={extractedData.date}
                        onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Series</label>
                      <input
                        type="text"
                        value={extractedData.series}
                        onChange={(e) => setExtractedData({ ...extractedData, series: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Episode #</label>
                      <input
                        type="text"
                        value={extractedData.episodeNumber}
                        onChange={(e) => setExtractedData({ ...extractedData, episodeNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Hosts (comma-separated)</label>
                    <input
                      type="text"
                      value={extractedData.hosts.join(', ')}
                      onChange={(e) => setExtractedData({ ...extractedData, hosts: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Guests (comma-separated)</label>
                    <input
                      type="text"
                      value={extractedData.guests.join(', ')}
                      onChange={(e) => setExtractedData({ ...extractedData, guests: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Transcript</label>
                    <textarea
                      value={extractedData.transcript}
                      onChange={(e) => setExtractedData({ ...extractedData, transcript: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary w-full"
                  >
                    {saving ? 'Saving...' : 'Save to Firebase'}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Bulk Processing Mode */}
        {mode === 'bulk' && (
          <>
            {/* Upload Section */}
            <div className="card-elevated p-8 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Bulk Upload</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Select Word documents for sequential processing
                  </p>
                </div>
                {bulkFiles.length > 0 && (
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                    {bulkFiles.length} files selected
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.txt"
                multiple
                onChange={handleBulkFileChange}
                className="hidden"
                // @ts-ignore - webkitdirectory is non-standard but widely supported
                webkitdirectory=""
              />

              <div className="flex gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={batchStats.inProgress}
                  className="flex-1 py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                >
                  <span className="text-4xl mb-2 block">📁</span>
                  <span className="font-semibold text-slate-700">Select Folder with Documents</span>
                  <span className="block text-sm text-slate-500 mt-1">Supports .doc, .docx, .txt files</span>
                </button>
              </div>

              {bulkFiles.length > 0 && !batchStats.inProgress && (
                <button
                  onClick={startBulkProcessing}
                  className="btn-primary w-full mt-4 py-4 text-lg"
                >
                  🚀 Start Processing {bulkFiles.length} Files
                </button>
              )}
            </div>

            {/* Processing Progress */}
            {batchStats.inProgress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-8 mb-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Processing in Progress</h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Currently processing: <span className="font-medium text-blue-600">{batchStats.currentFile}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className={`px-4 py-2 rounded-lg font-medium ${isPaused ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                        }`}
                    >
                      {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                    <button
                      onClick={stopProcessing}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
                    >
                      ⛔ Stop
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-6 bg-slate-200 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="absolute h-full gradient-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((batchStats.completed + batchStats.failed + batchStats.needsReview + batchStats.skipped) / batchStats.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
                    {batchStats.completed + batchStats.failed + batchStats.needsReview + batchStats.skipped} / {batchStats.total}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{batchStats.total}</div>
                    <div className="text-sm text-slate-600">Total Files</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{batchStats.completed}</div>
                    <div className="text-sm text-slate-600">Completed</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{batchStats.skipped}</div>
                    <div className="text-sm text-slate-600">Skipped</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">{batchStats.needsReview}</div>
                    <div className="text-sm text-slate-600">Needs Review</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{batchStats.failed}</div>
                    <div className="text-sm text-slate-600">Failed</div>
                  </div>
                </div>

                {batchStats.estimatedTimeRemaining && (
                  <p className="text-center text-slate-500 mt-4">
                    ⏱️ {batchStats.estimatedTimeRemaining}
                  </p>
                )}
              </motion.div>
            )}

            {/* Processing Queue */}
            {processingQueue.length > 0 && (
              <div className="card-elevated p-8 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Processing Queue</h2>
                  <div className="flex gap-2 flex-wrap">
                    {reviewItems.length > 0 && (
                      <>
                        <button
                          onClick={exportReviewReport}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
                        >
                          📥 Export Review Report
                        </button>
                        <button
                          onClick={saveAllReviewFiles}
                          disabled={bulkSaving}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all disabled:opacity-50"
                        >
                          {bulkSaving
                            ? `💾 Saving ${bulkSaveProgress.current}/${bulkSaveProgress.total}...`
                            : `💾 Save All ${reviewItems.length} to Firebase`}
                        </button>
                        <button
                          onClick={() => setShowReviewPanel(true)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-all"
                        >
                          ⚠️ Review {reviewItems.length} Files
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Legend */}
                <div className="flex gap-4 mb-4 text-sm flex-wrap">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Completed
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span> Skipped (Duplicate)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Needs Review
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> Failed
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Processing
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-300"></span> Pending
                  </span>
                </div>

                {/* File List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {processingQueue.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${item.status === 'needs_review' ? 'bg-yellow-50 border-yellow-200' :
                        item.status === 'failed' ? 'bg-red-50 border-red-200' :
                          item.status === 'completed' ? 'bg-green-50 border-green-200' :
                            item.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                              item.status === 'skipped' ? 'bg-purple-50 border-purple-200' :
                                'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></span>
                        <span className="font-medium text-sm truncate max-w-md">{item.fileName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.status === 'processing' && (
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-500"
                              animate={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        {item.status === 'needs_review' && (
                          <button
                            onClick={() => setReviewingFile(item)}
                            className="text-xs px-3 py-1 bg-yellow-500 text-white rounded-full"
                          >
                            Review
                          </button>
                        )}
                        {item.issues && item.issues.length > 0 && (
                          <span className="text-xs text-yellow-700">{item.issues.join(', ')}</span>
                        )}
                        {item.error && (
                          <span className="text-xs text-red-600">{item.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary after completion */}
            {!batchStats.inProgress && processingQueue.length > 0 && batchStats.completed > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-elevated p-8 bg-gradient-to-r from-green-50 to-blue-50"
              >
                <h2 className="text-2xl font-bold text-green-700 mb-4">✅ Processing Complete!</h2>
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{batchStats.completed}</div>
                    <div className="text-slate-600">Successfully Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{batchStats.skipped}</div>
                    <div className="text-slate-600">Skipped (Duplicates)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600">{batchStats.needsReview}</div>
                    <div className="text-slate-600">Need Manual Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">{batchStats.failed}</div>
                    <div className="text-slate-600">Failed</div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Review Modal */}
        <AnimatePresence>
          {reviewingFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setReviewingFile(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Review: {reviewingFile.fileName}</h2>
                  <button
                    onClick={() => setReviewingFile(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    ✕
                  </button>
                </div>

                {reviewingFile.issues && reviewingFile.issues.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Issues to Fix:</h3>
                    <ul className="list-disc list-inside text-yellow-700">
                      {reviewingFile.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewingFile.data && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Episode Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reviewingFile.data.episodeTitle}
                        onChange={(e) => setReviewingFile({
                          ...reviewingFile,
                          data: { ...reviewingFile.data!, episodeTitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={reviewingFile.data.date}
                          onChange={(e) => setReviewingFile({
                            ...reviewingFile,
                            data: { ...reviewingFile.data!, date: e.target.value }
                          })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Series <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={reviewingFile.data.series}
                          onChange={(e) => setReviewingFile({
                            ...reviewingFile,
                            data: { ...reviewingFile.data!, series: e.target.value }
                          })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Episode #</label>
                        <input
                          type="text"
                          value={reviewingFile.data.episodeNumber}
                          onChange={(e) => setReviewingFile({
                            ...reviewingFile,
                            data: { ...reviewingFile.data!, episodeNumber: e.target.value }
                          })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Hosts <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reviewingFile.data.hosts.join(', ')}
                        onChange={(e) => setReviewingFile({
                          ...reviewingFile,
                          data: { ...reviewingFile.data!, hosts: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Enter host names, separated by commas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Guests</label>
                      <input
                        type="text"
                        value={reviewingFile.data.guests.join(', ')}
                        onChange={(e) => setReviewingFile({
                          ...reviewingFile,
                          data: { ...reviewingFile.data!, guests: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Enter guest names, separated by commas"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleReviewSave}
                        disabled={saving}
                        className="flex-1 btn-primary"
                      >
                        {saving ? 'Saving...' : '✓ Save to Firebase'}
                      </button>
                      <button
                        onClick={() => setReviewingFile(null)}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
