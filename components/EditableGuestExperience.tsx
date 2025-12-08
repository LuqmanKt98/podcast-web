'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GuestWorkExperience } from '@/lib/types';

interface EditableGuestExperienceProps {
  experiences: GuestWorkExperience[];
  onSave?: (experiences: GuestWorkExperience[]) => void;
}

export default function EditableGuestExperience({ experiences, onSave }: EditableGuestExperienceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editExperiences, setEditExperiences] = useState<GuestWorkExperience[]>(experiences);

  const handleSave = () => {
    onSave?.(editExperiences);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditExperiences(experiences);
    setIsEditing(false);
  };

  const addExperience = () => {
    setEditExperiences([...editExperiences, { name: '', title: '', company: '' }]);
  };

  const updateExperience = (index: number, field: keyof GuestWorkExperience, value: string) => {
    const updated = [...editExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setEditExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setEditExperiences(editExperiences.filter((_, i) => i !== index));
  };

  if (experiences.length === 0 && !isEditing) {
    return (
      <div className="mb-8 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 border border-blue-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold gradient-text text-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H6a2 2 0 00-2-2V4m8 0h2a2 2 0 012 2v6.5" />
            </svg>
            Guest Work Experience
          </h3>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            Add Experience
          </button>
        </div>
        <p className="text-slate-600 mt-2">No guest work experience recorded.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 border border-blue-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold gradient-text text-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H6a2 2 0 00-2-2V4m8 0h2a2 2 0 012 2v6.5" />
          </svg>
          Guest Work Experience
        </h3>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {editExperiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/50 rounded-lg p-4 border border-blue-200 space-y-3"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-slate-700">Experience {index + 1}</h4>
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Guest Name"
                  value={exp.name}
                  onChange={(e) => updateExperience(index, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </motion.div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <button
              onClick={addExperience}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
            >
              Add Experience
            </button>
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
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="border-l-4 border-blue-500 pl-4 bg-white/50 rounded-r-lg p-3"
            >
              <p className="font-semibold text-heading">{exp.name}</p>
              <p className="text-body font-medium">{exp.title}</p>
              <p className="text-caption">{exp.company}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}