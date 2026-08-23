import React, { useState } from 'react';
import { UserPlus, X, Mail, Check, Sparkles } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  communityName: string;
  onClose: () => void;
  onInvite: (emailOrName: string) => Promise<void>;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  communityName,
  onClose,
  onInvite,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setError('Please enter a username or email address');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onInvite(inputVal.trim());
      setInputVal('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add user to community');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="invite-user-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="invite-user-modal"
        data-testid="invite-user-modal"
        className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200/80 dark:border-stone-800 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-secondary)] dark:text-[var(--theme-accent)] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Add Learner to Community
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Invite to <strong className="text-stone-800 dark:text-stone-200">{communityName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              User Email or Display Name
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="invite-email-input"
                data-testid="input-invite-email"
                type="text"
                required
                placeholder="e.g. alex@stanford.edu or Alex Rivera"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              The user will be immediately added as a member and can view the community leaderboard.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-invite-btn"
              data-testid="btn-confirm-invite"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
