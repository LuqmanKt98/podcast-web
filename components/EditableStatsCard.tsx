'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

interface EditableStatsCardProps {
  label: string;
  value: number | string;
  color: 'blue' | 'purple' | 'green' | 'orange';
  icon: string;
  onSave?: (newLabel: string, newValue: string | number) => void;
  isDateRange?: boolean;
}

export default function EditableStatsCard({ label, value, color, icon, onSave, isDateRange = false }: EditableStatsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [editValue, setEditValue] = useState(typeof value === 'number' ? value : 0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [displayLabel, setDisplayLabel] = useState(label);

  useEffect(() => {
    if (isDateRange && typeof value === 'string') {
      const parts = value.split(' to ');
      if (parts.length === 2) {
        setStartDate(parts[0]);
        setEndDate(parts[1]);
      }
    }
  }, [value, isDateRange]);

  // Auto-update label based on dates
  useEffect(() => {
    if (isDateRange && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();
      
      if (startYear === endYear) {
        setDisplayLabel(`${startYear} Archive`);
      } else {
        setDisplayLabel(`${startYear}-${endYear} Archive`);
      }
    } else {
      setDisplayLabel(editLabel);
    }
  }, [startDate, endDate, editLabel, isDateRange]);

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const handleIncrement = () => {
    const newValue = editValue + 1;
    setEditValue(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(0, editValue - 1);
    setEditValue(newValue);
  };

  const handleSave = () => {
    if (isDateRange) {
      const dateRangeValue = `${startDate} to ${endDate}`;
      onSave?.(displayLabel, dateRangeValue);
    } else {
      onSave?.(editLabel, editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(label);
    setEditValue(typeof value === 'number' ? value : 0);
    if (isDateRange && typeof value === 'string') {
      const parts = value.split(' to ');
      if (parts.length === 2) {
        setStartDate(parts[0]);
        setEndDate(parts[1]);
      }
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card-elevated p-6 relative group min-h-[180px] flex flex-col justify-between"
    >
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 z-10"
        title="Edit card"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      <div className="flex flex-col items-center justify-center text-center w-full flex-1">
        {/* Label/Heading */}
        <div className="w-full mb-3">
          {isEditing ? (
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="text-sm font-medium text-slate-600 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full text-center px-2 py-1"
              placeholder="Enter label"
            />
          ) : (
            <p className="text-sm font-medium text-slate-600">{displayLabel}</p>
          )}
        </div>

        {/* Value Display/Edit */}
        {isEditing ? (
          isDateRange ? (
            <div className="space-y-3 w-full">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm font-medium bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                  onClick={(e) => e.currentTarget.showPicker?.()}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm font-medium bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                  onClick={(e) => e.currentTarget.showPicker?.()}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 w-full">
              <button
                onClick={handleDecrement}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Decrease"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                className="text-3xl font-bold gradient-text bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none w-24 text-center"
                min="0"
              />
              <button
                onClick={handleIncrement}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Increase"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          )
        ) : (
          <div className={`font-bold gradient-text break-words leading-tight ${typeof value === 'number' ? 'text-3xl' : 'text-base'}`}>
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </div>
        )}

        {/* Icon */}
        <div className={`mt-4 p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg flex-shrink-0`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-2 mt-4 w-full">
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            ✓ Save
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}
