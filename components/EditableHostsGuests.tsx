'use client';

import { useState } from 'react';

interface EditableHostsGuestsProps {
  title: string;
  names: string[];
  icon: string;
  color: 'blue' | 'purple';
  onSave?: (names: string[]) => void;
}

export default function EditableHostsGuests({ title, names, icon, color, onSave }: EditableHostsGuestsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNames, setEditNames] = useState(names.join(', '));

  const colorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  const handleSave = () => {
    const newNames = editNames.split(',').map(n => n.trim()).filter(n => n);
    onSave?.(newNames);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditNames(names.join(', '));
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 relative group">
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      <h3 className="mb-3 font-semibold text-heading flex items-center gap-2">
        <svg className={`w-5 h-5 ${colorClasses[color]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
        {title}
      </h3>
      
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editNames}
            onChange={(e) => setEditNames(e.target.value)}
            placeholder="Names (comma separated)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
              ✓ Save
            </button>
            <button onClick={handleCancel} className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
              ✕ Cancel
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {names.map((name, idx) => (
            <li key={idx} className="text-body font-medium">
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}