import React, { useState, useMemo } from 'react';
import {
  Folder,
  Layers,
  Plus,
  Play,
  Brain,
  Gamepad2,
  FileCheck2,
  Sparkles,
  Search,
  Tag,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { Shelf, Subject, Card } from '../types';

interface HomeDashboardProps {
  shelves: Shelf[];
  subjects: Subject[];
  selectedShelfId: string | null;
  onSelectShelf: (shelfId: string | null) => void;
  onNavigateToShelvesManager: () => void;
  onOpenNewSubject: (shelfId: string) => void;
  onOpenEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onStartReview: (subject: Subject) => void;
  onStartLearnMode: (subject: Subject) => void;
  onStartMatchGame: (subject: Subject) => void;
  onStartTestSuite: (subject: Subject) => void;
  onViewSubjectDetails: (subject: Subject) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  shelves,
  subjects,
  selectedShelfId,
  onSelectShelf,
  onNavigateToShelvesManager,
  onOpenNewSubject,
  onOpenEditSubject,
  onDeleteSubject,
  onStartReview,
  onStartLearnMode,
  onStartMatchGame,
  onStartTestSuite,
  onViewSubjectDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeMenuSubjectId, setActiveMenuSubjectId] = useState<string | null>(null);

  // Map of shelf id to shelf
  const shelfMap = useMemo(() => {
    const map = new Map<string, Shelf>();
    shelves.forEach((s) => map.set(s.id, s));
    return map;
  }, [shelves]);

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (s.isDeleted) return false;
      if (selectedShelfId && selectedShelfId !== 'all' && s.shelfId !== selectedShelfId) {
        return false;
      }
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = selectedTag ? s.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [subjects, selectedShelfId, searchQuery, selectedTag]);

  // Aggregate tags for filtered view
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    subjects
      .filter((s) => !s.isDeleted && (!selectedShelfId || selectedShelfId === 'all' || s.shelfId === selectedShelfId))
      .forEach((s) => s.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [subjects, selectedShelfId]);

  // Total due cards across current view
  const totalDueInView = useMemo(() => {
    return filteredSubjects.reduce((acc, sub) => acc + (sub.dueCount || 0), 0);
  }, [filteredSubjects]);

  const currentShelfForCreation = selectedShelfId && selectedShelfId !== 'all'
    ? selectedShelfId
    : shelves[0]?.id || '';

  return (
    <div id="home-dashboard" className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#558B2F]" />
            <span>My Subjects</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Browse, study, and manage your flashcard subjects and active recall decks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Shelf Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-2xs">
            <Folder className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              id="shelf-filter-select"
              data-testid="shelf-filter-dropdown"
              value={selectedShelfId || 'all'}
              onChange={(e) => onSelectShelf(e.target.value === 'all' ? null : e.target.value)}
              className="text-xs font-semibold text-stone-700 bg-transparent focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">All Shelves ({subjects.filter((s) => !s.isDeleted).length})</option>
              {shelves.map((shelf) => {
                const count = subjects.filter((s) => s.shelfId === shelf.id && !s.isDeleted).length;
                return (
                  <option key={shelf.id} value={shelf.id}>
                    {shelf.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Create Subject Action */}
          <button
            id="create-subject-btn"
            data-testid="btn-create-subject"
            onClick={() => onOpenNewSubject(currentShelfForCreation)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subject</span>
          </button>
        </div>
      </div>

      {/* Due Cards Active Recall Alert Banner if cards need review */}
      {totalDueInView > 0 && (
        <div
          id="due-cards-alert-banner"
          className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-[#8BC34A]/15 border border-[#8BC34A]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#8BC34A] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span>{totalDueInView} Cards Due for FSRS Spaced Repetition</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Daily Review
                </span>
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Strengthen memory pathways and maintain your retention rate with active recall.
              </p>
            </div>
          </div>

          <button
            id="quick-start-review-all-btn"
            data-testid="btn-quick-review"
            onClick={() => {
              const firstDueSubject = filteredSubjects.find((s) => s.dueCount > 0);
              if (firstDueSubject) onStartReview(firstDueSubject);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-sm shadow-[#8BC34A]/30 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Review Session</span>
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-subjects-input"
            data-testid="search-input"
            type="text"
            placeholder="Search subjects by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8BC34A] focus:border-transparent transition-all"
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
      </div>

      {/* Tag Filter Pills */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Tags:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedTag === null
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#8BC34A] text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div
          id="empty-subjects-state"
          className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">No subjects found</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              {searchQuery || selectedTag
                ? 'Try clearing your search query or tag filters.'
                : 'Create your first flashcard deck to begin studying with FSRS spaced repetition.'}
            </p>
          </div>
          <button
            onClick={() => onOpenNewSubject(currentShelfForCreation)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subject Deck</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subject) => {
            const hasDue = subject.dueCount > 0;
            const parentShelf = shelfMap.get(subject.shelfId);
            return (
              <div
                key={subject.id}
                id={`subject-card-${subject.id}`}
                data-testid={`subject-card-${subject.id}`}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Header with color indicator */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold text-sm"
                        style={{ backgroundColor: subject.color || '#8BC34A' }}
                      >
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3
                          onClick={() => onViewSubjectDetails(subject)}
                          className="text-base font-bold text-stone-900 group-hover:text-[#558B2F] transition-colors cursor-pointer line-clamp-1"
                        >
                          {subject.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-stone-500">
                            {subject.cardCount} cards
                          </span>
                          {parentShelf && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[10px] font-semibold">
                              <Folder className="w-2.5 h-2.5 text-stone-400" />
                              {parentShelf.name}
                            </span>
                          )}
                          {hasDue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {subject.dueCount} due
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              All caught up
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Context Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuSubjectId(
                            activeMenuSubjectId === subject.id ? null : subject.id
                          )
                        }
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuSubjectId === subject.id && (
                        <div className="absolute right-0 top-8 z-20 w-36 bg-white rounded-xl shadow-lg border border-stone-100 py-1 text-xs font-semibold text-stone-700">
                          <button
                            onClick={() => {
                              setActiveMenuSubjectId(null);
                              onOpenEditSubject(subject);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 text-left cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                            <span>Edit Subject</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuSubjectId(null);
                              onDeleteSubject(subject.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Deck</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 mt-3 leading-relaxed">
                    {subject.description || 'No description provided.'}
                  </p>

                  {/* Tag Chips */}
                  {subject.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {subject.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {subject.tags.length > 3 && (
                        <span className="text-[10px] text-stone-400 font-medium self-center">
                          +{subject.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Study Action Buttons */}
                <div className="p-4 pt-3 bg-stone-50/70 border-t border-stone-100 space-y-2">
                  {/* Primary Action: Active Recall Review */}
                  <button
                    id={`review-btn-${subject.id}`}
                    data-testid={`btn-review-${subject.id}`}
                    onClick={() => onStartReview(subject)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{hasDue ? `Review Due (${subject.dueCount})` : 'Practice All Cards'}</span>
                  </button>

                  {/* Secondary Study Modes: Learn, Match, Test */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      id={`learn-mode-btn-${subject.id}`}
                      data-testid={`btn-learn-${subject.id}`}
                      onClick={() => onStartLearnMode(subject)}
                      title="Adaptive quiz mode"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5 text-amber-500" />
                      <span>Learn</span>
                    </button>

                    <button
                      id={`match-game-btn-${subject.id}`}
                      data-testid={`btn-match-${subject.id}`}
                      onClick={() => onStartMatchGame(subject)}
                      title="Speed matching game"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-sky-500" />
                      <span>Match</span>
                    </button>

                    <button
                      id={`test-suite-btn-${subject.id}`}
                      data-testid={`btn-test-${subject.id}`}
                      onClick={() => onStartTestSuite(subject)}
                      title="Diagnostic test assessment"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Test</span>
                    </button>
                  </div>

                  {/* Manage Deck Details Link */}
                  <button
                    onClick={() => onViewSubjectDetails(subject)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-stone-500 hover:text-stone-800 pt-1 cursor-pointer"
                  >
                    <span>View Cards & Test Suites</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
