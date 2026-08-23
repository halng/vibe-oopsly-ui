import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Layers,
  Folder,
  Check,
  Download,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  Eye,
  BookOpen,
} from 'lucide-react';
import { Subject, Shelf, Card } from '../types';
import { ApiService } from '../services/api';

interface CloneSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: (Subject & { cardsPreview?: Partial<Card>[] }) | null;
  shelves: Shelf[];
  onCloneSuccess: (clonedSubject: Subject, targetShelfId: string) => void;
  onCreateNewShelf?: (data: { name: string; description?: string; color?: string }) => Promise<Shelf | null>;
}

export const CloneSubjectModal: React.FC<CloneSubjectModalProps> = ({
  isOpen,
  onClose,
  subject,
  shelves,
  onCloneSuccess,
  onCreateNewShelf,
}) => {
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#8BC34A');
  const [showCardsPreview, setShowCardsPreview] = useState<boolean>(false);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick shelf creation state
  const [isCreatingShelf, setIsCreatingShelf] = useState<boolean>(false);
  const [newShelfName, setNewShelfName] = useState<string>('');
  const [newShelfColor, setNewShelfColor] = useState<string>('#8BC34A');
  const [isSubmittingNewShelf, setIsSubmittingNewShelf] = useState<boolean>(false);

  // Initialize modal state when subject changes
  useEffect(() => {
    if (subject) {
      setCustomTitle(subject.title || '');
      setCustomDescription(subject.description || '');
      setSelectedColor(subject.color || 'var(--theme-accent)');
      setErrorMsg(null);
      setShowCardsPreview(false);
      setIsCreatingShelf(false);

      // Default to first active shelf if available
      const activeShelves = shelves.filter((s) => !s.isDeleted);
      if (activeShelves.length > 0) {
        setSelectedShelfId((prev) => (prev && activeShelves.some((s) => s.id === prev) ? prev : activeShelves[0].id));
      } else {
        setSelectedShelfId('');
      }
    }
  }, [subject, shelves, isOpen]);

  if (!isOpen || !subject) return null;

  const activeShelves = shelves.filter((s) => !s.isDeleted);
  const targetShelf = activeShelves.find((s) => s.id === selectedShelfId);
  const sampleCards = subject.cardsPreview || [];

  const handleCreateQuickShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;

    setIsSubmittingNewShelf(true);
    try {
      if (onCreateNewShelf) {
        const created = await onCreateNewShelf({
          name: newShelfName.trim(),
          color: newShelfColor,
          description: 'Created for cloned flashcard decks',
        });
        if (created) {
          setSelectedShelfId(created.id);
          setIsCreatingShelf(false);
          setNewShelfName('');
        }
      } else {
        const res = await ApiService.createShelf({
          name: newShelfName.trim(),
          color: newShelfColor,
          description: 'Created for cloned flashcard decks',
        });
        if (res.isSuccess && res.data) {
          setSelectedShelfId(res.data.id);
          setIsCreatingShelf(false);
          setNewShelfName('');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create new shelf');
    } finally {
      setIsSubmittingNewShelf(false);
    }
  };

  const handleConfirmClone = async () => {
    if (!selectedShelfId) {
      setErrorMsg('Please select a target shelf to place this subject into.');
      return;
    }

    setIsCloning(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.cloneSubject(subject.id, selectedShelfId);
      if (res.isSuccess && res.data) {
        // If user customized title or color, patch it
        if (customTitle.trim() && customTitle.trim() !== subject.title) {
          await ApiService.updateSubject(res.data.id, {
            title: customTitle.trim(),
            description: customDescription.trim() || undefined,
            color: selectedColor,
          });
          res.data.title = customTitle.trim();
          res.data.color = selectedColor;
        }

        onCloneSuccess(res.data, selectedShelfId);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to clone deck. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while cloning the subject deck.');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div
      id="clone-subject-modal-overlay"
      data-testid="clone-subject-modal-overlay"
      className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="clone-subject-modal"
        data-testid="clone-subject-modal"
        className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Clone Subject Deck
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Review deck concepts and choose which shelf to place it in
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Subject Preview Card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/70 dark:border-stone-700/70 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                  style={{ backgroundColor: selectedColor || subject.color || 'var(--theme-accent)' }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-[var(--theme-accent)] tracking-wider block">
                    Source Deck
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    {subject.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                <span>{subject.cardCount || sampleCards.length} Cards</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {subject.description || 'No description provided for this flashcard deck.'}
            </p>

            {/* Tags */}
            {subject.tags && subject.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {subject.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded-md font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Choose Destination Shelf */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>Destination Shelf</span>
              </label>

              {!isCreatingShelf && (
                <button
                  type="button"
                  onClick={() => setIsCreatingShelf(true)}
                  className="text-xs font-bold text-[var(--theme-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Shelf</span>
                </button>
              )}
            </div>

            {/* Quick Create Shelf Form */}
            {isCreatingShelf ? (
              <form
                onSubmit={handleCreateQuickShelf}
                className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2.5 animate-in fade-in"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <span>Create Destination Shelf</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingShelf(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Shelf name (e.g. University, Tech Prep)"
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNewShelf || !newShelfName.trim()}
                    className="px-3 py-1.5 bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingNewShelf ? 'Creating...' : 'Save & Select'}
                  </button>
                </div>
              </form>
            ) : activeShelves.length === 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 space-y-2">
                <p className="font-semibold">You don't have any shelves yet.</p>
                <button
                  type="button"
                  onClick={() => setIsCreatingShelf(true)}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create your first shelf</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeShelves.map((shelf) => {
                  const isSelected = selectedShelfId === shelf.id;
                  return (
                    <button
                      key={shelf.id}
                      type="button"
                      onClick={() => setSelectedShelfId(shelf.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[var(--theme-accent)] bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] dark:bg-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--theme-accent)_30%,transparent)]'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-xs shadow-2xs"
                          style={{ backgroundColor: shelf.color || 'var(--theme-accent)' }}
                        >
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {shelf.name}
                          </h4>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                            {shelf.description || 'Collection of subjects'}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white'
                            : 'border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customize Cloned Subject Options */}
          <div className="p-3.5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-3">
            <span className="text-[11px] uppercase font-extrabold text-stone-500 dark:text-stone-400 tracking-wider block">
              Customize In Your Library
            </span>

            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Deck Name
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Subject title in your shelf..."
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Collapsible Sample Cards Preview */}
          {sampleCards.length > 0 && (
            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCardsPreview(!showCardsPreview)}
                className="w-full p-3 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-stone-400" />
                  <span>Preview Cards in Deck ({sampleCards.length} sample cards)</span>
                </div>
                {showCardsPreview ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {showCardsPreview && (
                <div className="p-3 space-y-2 max-h-52 overflow-y-auto bg-white dark:bg-stone-900">
                  {sampleCards.map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700/60 text-xs space-y-1"
                    >
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        <span className="text-[var(--theme-accent)] mr-1.5 font-extrabold">Q:</span>
                        {c.front}
                      </div>
                      <div className="text-stone-600 dark:text-stone-300 pl-4 border-l-2 border-stone-200 dark:border-stone-700">
                        <span className="text-stone-400 mr-1 font-semibold">A:</span>
                        {c.back}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isCloning || !selectedShelfId || !customTitle.trim()}
            onClick={handleConfirmClone}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-md shadow-stone-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isCloning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Cloning Deck...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  Clone to {targetShelf ? `"${targetShelf.name}"` : 'Selected Shelf'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
