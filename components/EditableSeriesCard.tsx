'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';

interface EditableSeriesCardProps {
  series: string;
  count: number;
  onSave?: (oldSeries: string, newSeries: string, newCount: number) => void;
  onDelete?: (series: string) => void;
}

export default function EditableSeriesCard({ series, count, onSave, onDelete }: EditableSeriesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editSeries, setEditSeries] = useState(series);
  const [editCount, setEditCount] = useState(count.toString());

  const handleSave = () => {
    onSave?.(series, editSeries, parseInt(editCount) || 0);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditSeries(series);
    setEditCount(count.toString());
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.(series);
    setShowConfirm(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Series"
        message={`Are you sure you want to delete series "${series}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
      <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center hover:shadow-md transition-all border border-slate-200 relative group"
    >
      {/* Edit/Delete Buttons */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded hover:bg-gray-200"
        >
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-red-200"
        >
          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            type="number"
            value={editCount}
            onChange={(e) => setEditCount(e.target.value)}
            className="text-2xl font-bold gradient-text bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full text-center"
          />
          <input
            type="text"
            value={editSeries}
            onChange={(e) => setEditSeries(e.target.value)}
            className="text-sm font-medium text-slate-700 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full text-center"
          />
          <div className="flex gap-1 justify-center mt-2">
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold gradient-text">{count}</p>
          <p className="text-sm font-medium text-slate-700">{series}</p>
        </>
      )}
    </motion.div>
    </>
  );
}