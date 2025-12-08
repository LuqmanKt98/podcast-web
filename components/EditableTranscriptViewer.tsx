'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditableTranscriptViewerProps {
  transcript: string;
  maxHeight?: number;
  hosts?: string[];
  guests?: string[];
  onSave?: (newTranscript: string) => void;
}

export default function EditableTranscriptViewer({
  transcript,
  maxHeight = 500,
  hosts = [],
  guests = [],
  onSave
}: EditableTranscriptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTranscript, setEditTranscript] = useState(transcript);
  const [copiedParagraph, setCopiedParagraph] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const paragraphs = transcript.split('\n\n').filter(p => p.trim());
  const shouldShowReadMore = paragraphs.length > 3;
  const displayParagraphs = isExpanded ? paragraphs : paragraphs.slice(0, 3);

  const handleSave = () => {
    onSave?.(editTranscript);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTranscript(transcript);
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, paragraphIndex?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (paragraphIndex !== undefined) {
        setCopiedParagraph(paragraphIndex);
        setTimeout(() => setCopiedParagraph(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatSpeakerText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">$1</strong>')
      .replace(/^([^:\[\n]+):/gm, '<span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">$1:</span>');
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Edit Transcript</h3>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <textarea
          ref={textareaRef}
          value={editTranscript}
          onChange={(e) => setEditTranscript(e.target.value)}
          className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono text-sm resize-vertical"
          placeholder="Enter transcript content..."
        />
        
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Formatting Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Use **Speaker Name**: for speaker identification</li>
            <li>Separate paragraphs with double line breaks</li>
            <li>Use [00:00:00] for timestamps</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-800">Transcript</h3>
          <span className="text-sm text-slate-500">
            {paragraphs.length} sections
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(transcript)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy All
          </button>
          
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Transcript Content */}
      <div 
        className="prose prose-slate max-w-none p-6"
        style={{ maxHeight: isExpanded ? 'none' : `${maxHeight}px` }}
      >
        <AnimatePresence>
          {displayParagraphs.map((paragraph, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group relative mb-6 p-4 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Copy Button for Paragraph */}
              <button
                onClick={() => copyToClipboard(paragraph, index)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-white shadow-sm"
                title="Copy paragraph"
              >
                {copiedParagraph === index ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              <div 
                className="leading-relaxed text-slate-700"
                dangerouslySetInnerHTML={{ 
                  __html: formatSpeakerText(paragraph.replace(/\n/g, '<br>'))
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Read More/Less Button */}
      {shouldShowReadMore && (
        <div className="px-6 pb-6">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Read Less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Read More ({paragraphs.length - 3} more sections)
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}