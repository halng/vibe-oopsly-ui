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
  ArrowLeft,
  Calendar,
  Zap,
  FileSpreadsheet,
  Copy,
  Target,
} from 'lucide-react';
import { Shelf, Subject, Card, UserProfile } from '../types';
import { ApiService } from '../services/api';
import { ImportCardsModal } from './ImportCardsModal';
import { CloneSubjectModal } from './CloneSubjectModal';

interface LibraryShelvesViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  shelves: Shelf[];
  subjects: Subject[];
  selectedShelfId: string | null;
  onSelectShelf: (shelfId: string | null) => void;
  onOpenNewShelf: () => void;
  onOpenEditShelf: (shelf: Shelf) => void;
  onDeleteShelf: (shelfId: string) => void;
  onOpenNewSubject: (shelfId: string) => void;
  onOpenEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onStartReview: (subject: Subject) => void;
  onStartLearnMode: (subject: Subject) => void;
  onStartMatchGame: (subject: Subject) => void;
  onStartTestSuite: (subject: Subject) => void;
  onViewSubjectDetails: (subject: Subject) => void;
  onJoinMultiplayer: () => void;
  onRefreshData?: () => void;
}

export const LibraryShelvesView: React.FC<LibraryShelvesViewProps> = ({
  user,
  onUpdateUser,
  shelves,
  subjects,
  selectedShelfId,
  onSelectShelf,
  onOpenNewShelf,
  onOpenEditShelf,
  onDeleteShelf,
  onOpenNewSubject,
  onOpenEditSubject,
  onDeleteSubject,
  onStartReview,
  onStartLearnMode,
  onStartMatchGame,
  onStartTestSuite,
  onViewSubjectDetails,
  onJoinMultiplayer,
  onRefreshData,
}) => {
  const [shelfSearchQuery, setShelfSearchQuery] = useState('');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [globalSubjectSearchQuery, setGlobalSubjectSearchQuery] = useState('');
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [dragOverShelfId, setDragOverShelfId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [reviewedToday, setReviewedToday] = React.useState(0);
  const [isEditingGoal, setIsEditingGoal] = React.useState(false);
  const [tempGoal, setTempGoal] = React.useState(user.settings?.dailyGoal || 20);

  React.useEffect(() => {
    ApiService.getStats().then((res) => {
      if (res.isSuccess && res.data) {
        setReviewedToday(res.data.reviewedToday);
      }
    });
  }, [user.totalReviews]);

  const handleSaveGoal = async () => {
    try {
      const newGoal = Math.max(1, tempGoal);
      const res = await ApiService.updateSettings({ dailyGoal: newGoal });
      if (res.isSuccess && res.data) {
        onUpdateUser({
          ...user,
          settings: { ...user.settings, dailyGoal: newGoal }
        });
        setIsEditingGoal(false);
      }
    } catch (err) {
      console.error('Failed to save goal', err);
    }
  };
  const [activeMenuShelfId, setActiveMenuShelfId] = useState<string | null>(null);
  const [activeMenuSubjectId, setActiveMenuSubjectId] = useState<string | null>(null);
  const [importingSubject, setImportingSubject] = useState<Subject | null>(null);
  const [selectedSubjectToClone, setSelectedSubjectToClone] = useState<Subject | null>(null);

  // Active Shelf object when a shelf is opened
  const activeShelf = useMemo<Shelf | null>(() => {
    if (!selectedShelfId) return null;
    return shelves.find((s) => s.id === selectedShelfId && !s.isDeleted) || null;
  }, [shelves, selectedShelfId]);

  // Compute stats for all shelves
  const shelfStatsMap = useMemo(() => {
    const map = new Map<string, { subjectCount: number; cardCount: number; dueCount: number }>();
    shelves.forEach((s) => {
      const shelfSubjects = subjects.filter((sub) => sub.shelfId === s.id && !sub.isDeleted);
      const cardCount = shelfSubjects.reduce((acc, sub) => acc + (sub.cardCount || 0), 0);
      const dueCount = shelfSubjects.reduce((acc, sub) => acc + (sub.dueCount || 0), 0);
      map.set(s.id, {
        subjectCount: shelfSubjects.length,
        cardCount,
        dueCount,
      });
    });
    return map;
  }, [shelves, subjects]);

  // Filter shelves for Level 1 (All Shelves View)
  const filteredShelves = useMemo(() => {
    return shelves.filter((s) => {
      if (s.isDeleted) return false;
      const matches =
        s.name.toLowerCase().includes(shelfSearchQuery.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(shelfSearchQuery.toLowerCase());
      return matches;
    });
  }, [shelves, shelfSearchQuery]);

  // Filter subjects for Level 2 (Selected Shelf Detail View)
  const filteredSubjectsInActiveShelf = useMemo(() => {
    if (!activeShelf) return [];
    return subjects.filter((s) => {
      if (s.shelfId !== activeShelf.id || s.isDeleted) return false;
      const matchesSearch =
        s.title.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(subjectSearchQuery.toLowerCase()));
      const matchesTag = selectedTag ? s.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [subjects, activeShelf, subjectSearchQuery, selectedTag]);

  // Tags in current active shelf
  
  // Filter subjects globally across all shelves
  const globalFilteredSubjects = useMemo(() => {
    if (!globalSubjectSearchQuery.trim()) return [];
    const query = globalSubjectSearchQuery.toLowerCase();
    return subjects.filter((s) => {
      if (s.isDeleted) return false;
      const matchesSearch =
        s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(query)));
      return matchesSearch;
    });
  }, [subjects, globalSubjectSearchQuery]);

  const recentSubjects = useMemo(() => {
    return subjects
      .filter((s) => !s.isDeleted)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [subjects]);

  const activeShelfTags = useMemo(() => {
    if (!activeShelf) return [];
    const tagsSet = new Set<string>();
    subjects
      .filter((s) => s.shelfId === activeShelf.id && !s.isDeleted)
      .forEach((s) => s.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [subjects, activeShelf]);

  // Total due cards in the active shelf
  const activeShelfTotalDue = useMemo(() => {
    return filteredSubjectsInActiveShelf.reduce((acc, s) => acc + (s.dueCount || 0), 0);
  }, [filteredSubjectsInActiveShelf]);

  // Global total due cards across all shelves
  const allShelvesTotalDue = useMemo(() => {
    return subjects
      .filter((s) => !s.isDeleted)
      .reduce((acc, s) => acc + (s.dueCount || 0), 0);
  }, [subjects]);

  const renderSubjectCard = (subject: Subject) => {
              const hasDue = subject.dueCount > 0;
              return (
                <div
                  key={subject.id}
                  id={`subject-card-${subject.id}`}
                  data-testid={`subject-card-${subject.id}`}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs font-bold text-sm shrink-0"
                          style={{ backgroundColor: subject.color || 'var(--theme-accent)' }}
                        >
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3
                            onClick={() => onViewSubjectDetails(subject)}
                            className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-[var(--theme-secondary)] dark:group-hover:text-[var(--theme-accent)] transition-colors cursor-pointer line-clamp-1"
                          >
                            {subject.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                              {subject.cardCount} cards
                            </span>
                            {hasDue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {subject.dueCount} due
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                All caught up
                              </span>
                            )}
                            {subject.schedule?.enabled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-800" title={`Scheduled at ${subject.schedule.time}`}>
                                <Clock className="w-2.5 h-2.5" />
                                {subject.schedule.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Context Menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuSubjectId(
                              activeMenuSubjectId === subject.id ? null : subject.id
                            )
                          }
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuSubjectId === subject.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 py-1 text-xs font-semibold text-stone-700 dark:text-stone-200">
                            <button
                              onClick={() => {
                                setActiveMenuSubjectId(null);
                                setImportingSubject(subject);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700 text-left text-emerald-700 dark:text-emerald-400 cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Import CSV / Excel</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuSubjectId(null);
                                setSelectedSubjectToClone(subject);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700 text-left text-[var(--theme-secondary)] dark:text-[var(--theme-accent)] cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Clone to Shelf</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuSubjectId(null);
                                onOpenEditSubject(subject);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700 text-left cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                              <span>Edit Subject</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuSubjectId(null);
                                onDeleteSubject(subject.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Deck</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-3 leading-relaxed">
                      {subject.description || 'No description provided.'}
                    </p>

                    {/* Tag Chips */}
                    {subject.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {subject.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-md text-[10px] font-medium"
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

                  {/* Study Actions */}
                  <div className="p-4 pt-3 bg-stone-50/70 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 space-y-2">
                    <button
                      id={`review-btn-${subject.id}`}
                      data-testid={`btn-review-${subject.id}`}
                      onClick={() => onStartReview(subject)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{hasDue ? `Review Due (${subject.dueCount})` : 'Practice All Cards'}</span>
                    </button>

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        id={`learn-mode-btn-${subject.id}`}
                        data-testid={`btn-learn-${subject.id}`}
                        onClick={() => onStartLearnMode(subject)}
                        title="Adaptive quiz mode"
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Brain className="w-3.5 h-3.5 text-amber-500" />
                        <span>Learn</span>
                      </button>

                      <button
                        id={`match-game-btn-${subject.id}`}
                        data-testid={`btn-match-${subject.id}`}
                        onClick={() => onStartMatchGame(subject)}
                        title="Speed matching game"
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-sky-500" />
                        <span>Match</span>
                      </button>

                      <button
                        id={`test-suite-btn-${subject.id}`}
                        data-testid={`btn-test-${subject.id}`}
                        onClick={() => onStartTestSuite(subject)}
                        title="Diagnostic test assessment"
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Test</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onViewSubjectDetails(subject)}
                      className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 pt-1 cursor-pointer"
                    >
                      <span>View Cards & Test Suites</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
  };

  const renderStudyGoalTracker = () => {
    const dailyGoal = user.settings?.dailyGoal || 20;
    const progress = Math.min((reviewedToday / dailyGoal) * 100, 100);

    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-5 mb-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Progress Background */}
        <div 
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--theme-accent)_5%,transparent)] dark:bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] pointer-events-none transition-all duration-1000" 
          style={{ width: `${progress}%` }} 
        />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Daily Study Goal</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {reviewedToday} of {dailyGoal} cards reviewed today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="flex-1 md:w-48 h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--theme-accent)] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-bold text-stone-700 dark:text-stone-300 min-w-[3ch] text-right shrink-0">
            {Math.round(progress)}%
          </span>
          <button 
            onClick={() => setIsEditingGoal(true)}
            className="ml-2 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Edit Daily Goal"
          >
            <Edit2 className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Goal Edit Inline/Modal */}
        {isEditingGoal && (
          <div className="absolute inset-0 bg-white dark:bg-stone-900 z-20 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <span className="font-bold text-stone-900 dark:text-stone-100">Set Daily Target:</span>
              <input
                type="number"
                min="1"
                max="500"
                value={tempGoal}
                onChange={(e) => setTempGoal(parseInt(e.target.value) || 20)}
                className="w-20 p-2 text-center bg-stone-100 dark:bg-stone-800 rounded-xl font-bold border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsEditingGoal(false);
                  setTempGoal(user.settings?.dailyGoal || 20);
                }}
                className="px-4 py-2 text-sm font-bold text-stone-500 hover:text-stone-700 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveGoal}
                className="px-4 py-2 text-sm font-bold text-white bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] rounded-xl shadow-xs cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW 1: SHELF DETAILS (1:n SUBJECTS)
  // ==========================================
  const activeShelfStats = activeShelf 
    ? (shelfStatsMap.get(activeShelf.id) || { subjectCount: 0, cardCount: 0, dueCount: 0 }) 
    : { subjectCount: 0, cardCount: 0, dueCount: 0 };
  const stats = activeShelfStats;

  return (
    <>
      {activeShelf ? (

      <div id="shelf-detail-view" className="space-y-6 animate-fade-in">
        {renderStudyGoalTracker()}
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            id="back-to-shelves-btn"
            data-testid="btn-back-to-shelves"
            onClick={() => onSelectShelf(null)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shadow-2xs group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>All Shelves</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="edit-shelf-btn"
              onClick={() => onOpenEditShelf(activeShelf)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Edit Shelf</span>
            </button>
            <button
              id="create-subject-in-shelf-btn"
              data-testid="btn-create-subject-in-shelf"
              onClick={() => onOpenNewSubject(activeShelf.id)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Subject</span>
            </button>
          </div>
        </div>

        {/* Shelf Banner Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-2 h-full"
            style={{ backgroundColor: activeShelf.color || 'var(--theme-accent)' }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs shrink-0 text-lg"
                style={{ backgroundColor: activeShelf.color || 'var(--theme-accent)' }}
              >
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                    {activeShelf.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold">
                    Shelf
                  </span>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
                  {activeShelf.description || 'Collection of subjects, flashcard decks, and practice tests.'}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <div className="px-3.5 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 text-center min-w-[75px]">
                <div className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {stats.subjectCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Subjects
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 text-center min-w-[75px]">
                <div className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {stats.cardCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Cards
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-center min-w-[75px]">
                <div className="text-base font-extrabold text-amber-800 dark:text-amber-400">
                  {stats.dueCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 tracking-wider">
                  Due FSRS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Due Cards Active Recall Alert Banner if cards need review in this shelf */}
        {activeShelfTotalDue > 0 && (
          <div
            id="due-cards-alert-banner"
            className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--theme-accent)_40%,transparent)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Clock className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>{activeShelfTotalDue} Cards Due in {activeShelf.name}</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    FSRS Review
                  </span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Maintain your memory retention curve with active recall practice.
                </p>
              </div>
            </div>

            <button
              id="quick-start-shelf-review-btn"
              data-testid="btn-quick-shelf-review"
              onClick={() => {
                const firstDueSubject = filteredSubjectsInActiveShelf.find((s) => s.dueCount > 0);
                if (firstDueSubject) onStartReview(firstDueSubject);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-sm shadow-stone-500/30 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Review Session</span>
            </button>
          </div>
        )}

        {/* Subjects Search & Tag Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-subjects-in-shelf-input"
              data-testid="search-subjects-input"
              type="text"
              placeholder={`Search ${stats.subjectCount} subjects in this shelf...`}
              value={subjectSearchQuery}
              onChange={(e) => setSubjectSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
            />
            {subjectSearchQuery && (
              <button
                onClick={() => setSubjectSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tag Filters */}
        {activeShelfTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Tags:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedTag === null
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300'
              }`}
            >
              All
            </button>
            {activeShelfTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[var(--theme-accent)] text-white'
                    : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Subjects Grid (1:n) */}
        {filteredSubjectsInActiveShelf.length === 0 ? (
          <div
            id="empty-shelf-subjects-state"
            className="bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                No subjects in this shelf yet
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
                Create a subject deck to start adding flashcards, test suites, and adaptive quizzes.
              </p>
            </div>
            <button
              onClick={() => onOpenNewSubject(activeShelf.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Subject</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjectsInActiveShelf.map(renderSubjectCard)}
          </div>
        )}
      </div>
      ) : (
        <div id="library-all-shelves-view" className="space-y-6 animate-fade-in">
          {renderStudyGoalTracker()}
          {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
            <Folder className="w-6 h-6 text-[var(--theme-secondary)] dark:text-[var(--theme-accent)]" />
            <span>My Library Shelves</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Organize your knowledge hierarchy: Shelves → Subjects → Cards & Tests.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onJoinMultiplayer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold shadow-xs transition-colors cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Join Game</span>
          </button>
          
          <button
            id="create-new-shelf-btn"
            data-testid="btn-create-shelf"
            onClick={onOpenNewShelf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Shelf</span>
          </button>
        </div>
      </div>


      {/* Recent Activity */}
      {!globalSubjectSearchQuery.trim() && !shelfSearchQuery.trim() && recentSubjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentSubjects.map(renderSubjectCard)}
          </div>
        </div>
      )}

      {/* Global Due Reminder */}
      {allShelvesTotalDue > 0 && (
        <div
          id="global-due-cards-banner"
          className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--theme-accent)_40%,transparent)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>{allShelvesTotalDue} Total Cards Due for Daily FSRS Review</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  Spaced Repetition
                </span>
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Select any shelf below to dive into its subject decks and start active recall.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Toolbars */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-shelves-input"
            data-testid="search-shelves-input"
            type="text"
            placeholder="Search shelves..."
            value={shelfSearchQuery}
            onChange={(e) => setShelfSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
          />
          {shelfSearchQuery && (
            <button
              onClick={() => setShelfSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all subjects by title or tag..."
            value={globalSubjectSearchQuery}
            onChange={(e) => setGlobalSubjectSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
          />
          {globalSubjectSearchQuery && (
            <button
              onClick={() => setGlobalSubjectSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Shelves Grid (Level 1) or Global Subjects */}
      {globalSubjectSearchQuery.trim() ? (
        globalFilteredSubjects.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                No subjects found
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
                Try adjusting your search query.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {globalFilteredSubjects.map(renderSubjectCard)}
          </div>
        )
      ) : filteredShelves.length === 0 ? (
        <div
          id="empty-shelves-state"
          className="bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
            <Folder className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
              No shelves found
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
              Create your first Shelf to categorize and organize your subjects and study cards.
            </p>
          </div>
          <button
            onClick={onOpenNewShelf}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:bg-[var(--theme-secondary)] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Shelf</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShelves.map((shelf) => {
            const stats = shelfStatsMap.get(shelf.id) || { subjectCount: 0, cardCount: 0, dueCount: 0 };
            return (
              <div
                key={shelf.id}
                id={`shelf-card-${shelf.id}`}
                data-testid={`shelf-card-${shelf.id}`}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-[color-mix(in_srgb,var(--theme-accent)_50%,transparent)] relative cursor-pointer"
                onClick={() => onSelectShelf(shelf.id)}
              >
                {/* Top Shelf Color Bar */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: shelf.color || 'var(--theme-accent)' }}
                />

                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xs font-bold text-lg shrink-0 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: shelf.color || 'var(--theme-accent)' }}
                      >
                        <Folder className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-[var(--theme-secondary)] dark:group-hover:text-[var(--theme-accent)] transition-colors line-clamp-1">
                          {shelf.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                            {stats.subjectCount} {stats.subjectCount === 1 ? 'subject' : 'subjects'}
                          </span>
                          <span className="text-stone-300 dark:text-stone-700">•</span>
                          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                            {stats.cardCount} cards
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Options Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          setActiveMenuShelfId(
                            activeMenuShelfId === shelf.id ? null : shelf.id
                          )
                        }
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuShelfId === shelf.id && (
                        <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-100 dark:border-stone-700 py-1 text-xs font-semibold text-stone-700 dark:text-stone-200">
                          <button
                            onClick={() => {
                              setActiveMenuShelfId(null);
                              onOpenEditShelf(shelf);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700 text-left cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                            <span>Edit Shelf</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuShelfId(null);
                              onOpenNewSubject(shelf.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-700 text-left cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-[var(--theme-secondary)]" />
                            <span>Add Subject</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuShelfId(null);
                              onDeleteShelf(shelf.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Shelf</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-4 leading-relaxed min-h-[32px]">
                    {shelf.description || 'No description provided.'}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80">
                    {stats.dueCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        {stats.dueCount} cards due
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Ready to study
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-6 py-3.5 bg-stone-50/80 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--theme-secondary)] dark:text-[var(--theme-accent)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore {stats.subjectCount} {stats.subjectCount === 1 ? 'Subject' : 'Subjects'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNewSubject(shelf.id);
                    }}
                    title="Quick add subject"
                    className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
      )}

      {/* Direct Import Cards Modal */}
      {importingSubject && (
        <ImportCardsModal
          subject={importingSubject}
          isOpen={Boolean(importingSubject)}
          onClose={() => setImportingSubject(null)}
          onImportSuccess={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Clone Subject Confirmation Modal */}
      {selectedSubjectToClone && (
        <CloneSubjectModal
          isOpen={Boolean(selectedSubjectToClone)}
          onClose={() => setSelectedSubjectToClone(null)}
          subject={selectedSubjectToClone}
          shelves={shelves}
          onCloneSuccess={() => {
            setSelectedSubjectToClone(null);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* Floating Drag & Drop Overlay */}
      {draggedSubjectId && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-50 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-300 shadow-2xl">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
            Drop subject to move to a shelf
          </h3>
          <div className="flex gap-4 overflow-x-auto max-w-4xl w-full pb-2 px-4 justify-center items-center">
            {shelves.filter((s: Shelf) => s.id !== activeShelf?.id).map((shelf: Shelf) => (
              <div
                key={shelf.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverShelfId(shelf.id);
                }}
                onDragLeave={() => {
                  if (dragOverShelfId === shelf.id) setDragOverShelfId(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const subjectId = e.dataTransfer.getData('subjectId');
                  setDraggedSubjectId(null);
                  setDragOverShelfId(null);
                  if (subjectId) {
                    try {
                      await ApiService.updateSubject(subjectId, { shelfId: shelf.id });
                      if (onRefreshData) onRefreshData();
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all min-w-[120px] max-w-[140px] ${
                  dragOverShelfId === shelf.id 
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 scale-110 shadow-lg' 
                    : 'border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: shelf.color || 'var(--theme-accent)' }}>
                  <Folder className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-center line-clamp-1 w-full text-stone-700 dark:text-stone-300">{shelf.name}</span>
              </div>
            ))}
            {shelves.filter((s: Shelf) => s.id !== activeShelf?.id).length === 0 && (
              <span className="text-sm font-semibold text-stone-500">No other shelves available.</span>
            )}
          </div>
        </div>
      )}
    </>
  );
};