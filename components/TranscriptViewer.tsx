'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { slideUpVariants, prefersReducedMotion } from '@/lib/animations';

interface TranscriptViewerProps {
  transcript: string;
  maxHeight?: number;
  hosts?: string[];
  guests?: string[];
}

export default function TranscriptViewer({
  transcript,
  maxHeight = 400,
  hosts = [],
  guests = [],
}: TranscriptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const reducedMotion = prefersReducedMotion();

  // Function to parse and format transcript text
  const formatTranscriptLine = (line: string) => {
    // Try to match already formatted speaker pattern: **Speaker Name** (Host/Guest): dialogue
    let speakerMatch = line.match(/^\*\*(.+?)\*\*(\s*\((?:Host|Guest)\))?:\s*(.+)$/);

    // If not found, try to match unformatted speaker pattern: Speaker Name: dialogue
    if (!speakerMatch) {
      speakerMatch = line.match(/^([A-Za-z\s\.\-\'àáâãäåèéêëìíîïòóôõöùúûüýÿÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸçÇñÑ]+?)(\s*\[[\d:]+\])?\s*:\s*(.+)$/);

      if (speakerMatch) {
        const speakerName = speakerMatch[1].trim();
        const timestamp = speakerMatch[2] || '';
        const dialogue = speakerMatch[3].trim();

        // Skip if speaker name is too long (likely not a real speaker)
        if (speakerName.length > 50) {
          return <p className="text-sm leading-relaxed text-slate-600 mb-2">{line}</p>;
        }

        // Determine if speaker is host or guest
        const isHost = hosts.some(h => h.toLowerCase().trim() === speakerName.toLowerCase().trim());
        const isGuest = guests.some(g => g.toLowerCase().trim() === speakerName.toLowerCase().trim());

        return (
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`font-bold text-base ${isHost ? 'text-blue-700' : isGuest ? 'text-purple-700' : 'text-slate-800'}`}>
                {speakerName}
              </span>
              {(isHost || isGuest) && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isHost ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {isHost ? 'Host' : 'Guest'}
                </span>
              )}
              {timestamp && (
                <span className="text-xs text-slate-400">{timestamp}</span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-700 pl-4 border-l-2 border-slate-200">
              {dialogue}
            </p>
          </div>
        );
      }
    } else {
      // Already formatted with **bold**
      const speakerName = speakerMatch[1];
      const role = speakerMatch[2] || '';
      const dialogue = speakerMatch[3];

      // Determine if speaker is host or guest
      const isHost = hosts.some(h => h.toLowerCase().trim() === speakerName.toLowerCase().trim());
      const isGuest = guests.some(g => g.toLowerCase().trim() === speakerName.toLowerCase().trim());

      return (
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`font-bold text-base ${isHost ? 'text-blue-700' : isGuest ? 'text-purple-700' : 'text-slate-800'}`}>
              {speakerName}
            </span>
            {(isHost || isGuest) && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${isHost ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {isHost ? 'Host' : 'Guest'}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-slate-700 pl-4 border-l-2 border-slate-200">
            {dialogue}
          </p>
        </div>
      );
    }

    // Regular line (not a speaker line)
    return <p className="text-sm leading-relaxed text-slate-600 mb-2">{line}</p>;
  };

  // Split transcript into lines and group by speakers
  const lines = transcript.split('\n').filter((line) => line.trim().length > 0);

  // Group consecutive lines into paragraphs
  const paragraphs: string[][] = [];
  let currentParagraph: string[] = [];

  lines.forEach((line, index) => {
    // Check if line is a speaker line (formatted or unformatted)
    const isFormattedSpeaker = line.match(/^\*\*(.+?)\*\*(\s*\((?:Host|Guest)\))?:/);
    const isUnformattedSpeaker = line.match(/^([A-Za-z\s\.\-\'àáâãäåèéêëìíîïòóôõöùúûüýÿÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸçÇñÑ]+?)(\s*\[[\d:]+\])?\s*:/);
    const isSpeakerLine = isFormattedSpeaker || isUnformattedSpeaker;

    if (isSpeakerLine) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = [];
      }
      currentParagraph.push(line);
    } else if (line.trim()) {
      currentParagraph.push(line);
    }
  });

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }

  const displayedParagraphs = isExpanded ? paragraphs : paragraphs.slice(0, 5);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div
      variants={slideUpVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: reducedMotion ? 0 : 0.5 }}
    >
      <div className="space-y-4">
        <div
          className={`rounded-xl bg-white border border-slate-200 p-6 relative shadow-sm ${!isExpanded ? 'overflow-hidden' : ''}`}
          style={!isExpanded ? { maxHeight: `${maxHeight}px` } : {}}
        >
          <div className="space-y-4">
            {displayedParagraphs.map((paragraphLines, index) => (
              <motion.div
                key={index}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.3,
                  delay: reducedMotion ? 0 : index * 0.05,
                }}
                className="group relative"
              >
                <div className="space-y-2">
                  {paragraphLines.map((line, lineIndex) => (
                    <div key={lineIndex}>
                      {formatTranscriptLine(line)}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleCopy(paragraphLines.join('\n'), index)}
                  className="absolute right-0 top-0 rounded-lg gradient-primary px-3 py-1 text-xs text-white opacity-0 transition-all group-hover:opacity-100 shadow-sm"
                  title="Copy to clipboard"
                >
                  {copiedIndex === index ? '✓ Copied' : 'Copy'}
                </button>
              </motion.div>
            ))}
          </div>

          {!isExpanded && paragraphs.length > 5 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {paragraphs.length > 5 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Read Full Transcript
              </>
            )}
          </motion.button>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleCopy(transcript, -1)}
            className="btn-primary flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copiedIndex === -1 ? 'Copied!' : 'Copy Transcript'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

