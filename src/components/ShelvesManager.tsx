import React, { useState, useMemo } from 'react';
import {
  Folder,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Layers,
  Search,
  ArrowRight,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Shelf, Subject } from '../types';

interface ShelvesManagerProps {
  shelves: Shelf[];
  subjects: Subject[];
  onSelectShelfAndGoToLibrary: (shelfId: string) => void;
  onOpenNewShelf: () => void;
  onOpenEditShelf: (shelf: Shelf) => void;
  onDeleteShelf: (shelfId: string) => void;
  onOpenNewSubject: (shelfId: string) => void;
}

export const ShelvesManager: React.FC<ShelvesManagerProps> = ({
  shelves,
  subjects,
  onSelectShelfAndGoToLibrary,
  onOpenNewShelf,
  onOpenEditShelf,
  onDeleteShelf,
  onOpenNewSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Compute shelf stats
  const shelvesWithCalculations = useMemo(() => {
    return shelves
      .filter((s) => !s.isDeleted)
      .map((shelf) => {
        const shelfSubs = subjects.filter((sub) => sub.shelfId === shelf.id && !sub.isDeleted);
        const totalCards = shelfSubs.reduce((acc, sub) => acc + (sub.cardCount || 0), 0);
        const totalDue = shelfSubs.reduce((acc, sub) => acc + (sub.dueCount || 0), 0);

        return {
          ...shelf,
          subjects: shelfSubs,
          subjectCount: shelfSubs.length,
          totalCards,
          totalDue,
        };
      });
  }, [shelves, subjects]);

  const filteredShelves = useMemo(() => {
    return shelvesWithCalculations.filter((shelf) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        shelf.name.toLowerCase().includes(q) ||
        (shelf.description && shelf.description.toLowerCase().includes(q))
      );
    });
  }, [shelvesWithCalculations, searchQuery]);

  const totalAllSubjects = subjects.filter((s) => !s.isDeleted).length;
  const totalAllCards = subjects
    .filter((s) => !s.isDeleted)
    .reduce((acc, s) => acc + (s.cardCount || 0), 0);
  const totalAllDue = subjects
    .filter((s) => !s.isDeleted)
    .reduce((acc, s) => acc + (s.dueCount || 0), 0);

  return (
    <div id="shelves-management-section" className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Folder className="w-6 h-6 text-[var(--theme-secondary)]" />
            <span>Manage Shelves</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Create, categorize, and organize your flashcard shelves and collections.
          </p>
        </div>

        <button
          id="btn-create-new-shelf"
          data-testid="btn-create-shelf-section"
          onClick={onOpenNewShelf}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Shelf</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-50 text-[var(--theme-secondary)] flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Total Shelves
            </span>
            <div className="text-xl font-black text-stone-900">{shelvesWithCalculations.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Active Subjects
            </span>
            <div className="text-xl font-black text-stone-900">{totalAllSubjects}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Total Flashcards
            </span>
            <div className="text-xl font-black text-stone-900">{totalAllCards}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Reviews Due
            </span>
            <div className="text-xl font-black text-stone-900">{totalAllDue}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="search-shelves-input"
          data-testid="search-shelves"
          type="text"
          placeholder="Filter shelves by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Shelves List Grid */}
      {filteredShelves.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
            <Folder className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">No shelves found</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              Create your first shelf to organize your subjects and study materials.
            </p>
          </div>
          <button
            onClick={onOpenNewShelf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Shelf</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShelves.map((shelf) => {
            const isConfirmingDelete = confirmDeleteId === shelf.id;
            return (
              <div
                key={shelf.id}
                id={`shelf-card-${shelf.id}`}
                data-testid={`shelf-item-${shelf.id}`}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  {/* Top Bar with Icon & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                        style={{ backgroundColor: shelf.color || 'var(--theme-accent)' }}
                      >
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h3
                          onClick={() => onSelectShelfAndGoToLibrary(shelf.id)}
                          className="text-base font-bold text-stone-900 group-hover:text-[var(--theme-secondary)] transition-colors cursor-pointer line-clamp-1"
                        >
                          {shelf.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-stone-400">
                          Created {new Date(shelf.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditShelf(shelf)}
                        title="Edit Shelf"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : shelf.id)}
                        title="Delete Shelf"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Confirmation for Delete */}
                  {isConfirmingDelete && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2">
                      <p className="text-red-800 font-semibold">
                        Are you sure you want to delete "{shelf.name}"?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onDeleteShelf(shelf.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-lg text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Shelf Description */}
                  <p className="text-xs text-stone-600 line-clamp-2 mt-3 leading-relaxed">
                    {shelf.description || 'No description provided for this shelf.'}
                  </p>

                  {/* Shelf Stats Counters */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-100 text-center">
                    <div className="bg-stone-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Subjects
                      </span>
                      <span className="text-sm font-bold text-stone-800">{shelf.subjectCount}</span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Cards
                      </span>
                      <span className="text-sm font-bold text-stone-800">{shelf.totalCards}</span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Due
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          shelf.totalDue > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {shelf.totalDue}
                      </span>
                    </div>
                  </div>

                  {/* Subject preview chips */}
                  {shelf.subjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {shelf.subjects.slice(0, 3).map((sub) => (
                        <span
                          key={sub.id}
                          className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-medium truncate max-w-[130px]"
                        >
                          {sub.title}
                        </span>
                      ))}
                      {shelf.subjects.length > 3 && (
                        <span className="text-[10px] text-stone-400 font-medium self-center">
                          +{shelf.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenNewSubject(shelf.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-white text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--theme-secondary)]" />
                    <span>Add Subject</span>
                  </button>

                  <button
                    id={`open-shelf-${shelf.id}`}
                    data-testid={`btn-open-shelf-${shelf.id}`}
                    onClick={() => onSelectShelfAndGoToLibrary(shelf.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>View Subjects</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
