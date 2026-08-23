import React, { useState } from 'react';
import { X, Layers, Save, Tag } from 'lucide-react';
import { Subject, Shelf } from '../types';

interface SubjectModalProps {
  shelfId: string;
  shelves: Shelf[];
  subject?: Subject | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    color?: string;
    tags?: string[];
    shelfId?: string;
  }) => Promise<void>;
}

const PRESET_COLORS = [
  '#8BC34A',
  '#4CAF50',
  '#009688',
  '#03A9F4',
  '#3F51B5',
  '#9C27B0',
  '#E91E63',
  '#FF9800',
  '#795548',
  '#607D8B',
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  shelfId,
  shelves,
  subject,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(subject?.title || '');
  const [description, setDescription] = useState(subject?.description || '');
  const [color, setColor] = useState(subject?.color || 'var(--theme-accent)');
  const [tags, setTags] = useState(subject?.tags ? subject.tags.join(', ') : '');
  const [selectedShelfId, setSelectedShelfId] = useState(subject?.shelfId || shelfId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        tags: tagsArray,
        shelfId: selectedShelfId,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="subject-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: color }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {subject ? 'Edit Subject' : 'Create New Deck'}
              </h2>
              <p className="text-xs text-stone-500">Flashcard subject for active recall</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Subject Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems & Consensus, Japanese N3 Kanji"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Shelf Location</label>
            <select
              value={selectedShelfId}
              onChange={(e) => setSelectedShelfId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:ring-2 focus:ring-[var(--theme-accent)]"
            >
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief summary of concepts covered in this deck..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. algorithms, cs, backend"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-2">Subject Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'ring-2 ring-stone-900 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold text-xs hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Deck'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
