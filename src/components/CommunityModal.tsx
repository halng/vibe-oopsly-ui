import React, { useState } from 'react';
import { Users, X, Lock, Globe, Sparkles, Check, Hash } from 'lucide-react';
import { Community } from '../types';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
    isPrivate: boolean;
    tags: string[];
  }) => Promise<void>;
}

const COLOR_PRESETS = [
  '#8BC34A', // Green
  '#03A9F4', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#009688', // Teal
  '#F44336', // Red
  '#3F51B5', // Indigo
];

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['study-group']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const cleaned = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a community name');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        icon: 'Users',
        color,
        isPrivate,
        tags,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create community');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-community-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="create-community-modal"
        data-testid="create-community-modal"
        className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200/80 dark:border-stone-800 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs font-bold"
              style={{ backgroundColor: color }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Create Learning Community
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Build a collaborative space to study flashcards and climb leaderboards together
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Community Name *
            </label>
            <input
              id="community-name-input"
              data-testid="input-community-name"
              type="text"
              required
              placeholder="e.g. Distributed Systems Guild, MedPass 2026, JLPT N2 Sprint"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8BC34A]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Purpose & Focus
            </label>
            <textarea
              id="community-description-input"
              rows={2}
              placeholder="Describe your learning goals, target exams, or study topics..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8BC34A]"
            />
          </div>

          {/* Access Type: Public vs Request-to-Join (Private) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Membership & Privacy
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="community-type-public"
                onClick={() => setIsPrivate(false)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  !isPrivate
                    ? 'border-[#8BC34A] ring-2 ring-[#8BC34A]/30 bg-[#8BC34A]/5 dark:bg-[#8BC34A]/10'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Open Community
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Anyone can join instantly and view leaderboard
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="community-type-private"
                onClick={() => setIsPrivate(true)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  isPrivate
                    ? 'border-[#8BC34A] ring-2 ring-[#8BC34A]/30 bg-[#8BC34A]/5 dark:bg-[#8BC34A]/10'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Request to Join
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    Requires owner/admin approval to join
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Color Badge */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    color === c ? 'scale-110 ring-2 ring-stone-900 dark:ring-white ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Topic Tags
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Hash className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. leetcode, biology, japanese"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8BC34A]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-stone-400 hover:text-stone-700 ml-0.5 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-create-community-btn"
              data-testid="btn-submit-create-community"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Community'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
