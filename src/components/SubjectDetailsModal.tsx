import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Play,
  Brain,
  Gamepad2,
  FileCheck2,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  Layers,
  Check,
  Tag,
  Lightbulb,
  FileText,
  Clock,
  FileSpreadsheet,
  Users,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Subject, Card, TestSuite } from '../types';
import { ApiService } from '../services/api';
import { formatInterval } from '../utils/fsrs';
import { ImportCardsModal } from './ImportCardsModal';
import { SubjectScheduleModal } from './SubjectScheduleModal';

interface SubjectDetailsModalProps {
  subject: Subject;
  onClose: () => void;
  onStartReview: (subject: Subject) => void;
  onStartLearn: (subject: Subject) => void;
  onStartMatch: (subject: Subject) => void;
  onStartTest: (subject: Subject) => void;
  onHostMultiplayer: (subject: Subject) => void;
  onRefreshSubjects: () => void;
}

export const SubjectDetailsModal: React.FC<SubjectDetailsModalProps> = ({
  subject,
  onClose,
  onStartReview,
  onStartLearn,
  onStartMatch,
  onStartTest,
  onHostMultiplayer,
  onRefreshSubjects,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Card State
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newTags, setNewTags] = useState('');

  // AI Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState(subject.title);
  const [aiNotes, setAiNotes] = useState('');
  const [aiCardCount, setAiCardCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Import CSV/Excel Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Edit Card State
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getSubject(subject.id);
      if (res.isSuccess && res.data) {
        setCards(res.data.cards || []);
        setTestSuites(res.data.testSuites || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to sync events to reload cards when background sync completes
    const handleSyncComplete = () => {
      loadData();
    };
    window.addEventListener('oopsly-sync-completed', handleSyncComplete);
    return () => window.removeEventListener('oopsly-sync-completed', handleSyncComplete);
  }, [subject.id]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const res = await ApiService.createCard(subject.id, {
      front: newFront,
      back: newBack,
      hint: newHint || undefined,
      tags: tagsArray,
    });

    if (res.isSuccess) {
      setNewFront('');
      setNewBack('');
      setNewHint('');
      setNewTags('');
      setIsAddingCard(false);
      loadData();
      onRefreshSubjects();
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editingCard.front.trim() || !editingCard.back.trim()) return;

    const res = await ApiService.updateCard(editingCard.id, {
      front: editingCard.front,
      back: editingCard.back,
      hint: editingCard.hint,
      tags: editingCard.tags,
    });

    if (res.isSuccess) {
      setEditingCard(null);
      loadData();
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    const res = await ApiService.deleteCard(cardId);
    if (res.isSuccess) {
      loadData();
      onRefreshSubjects();
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);

    try {
      const res = await ApiService.generateCardsWithAI(aiTopic, aiNotes, aiCardCount);
      if (res.isSuccess && res.data) {
        // Create each generated card
        for (const genCard of res.data) {
          await ApiService.createCard(subject.id, {
            front: genCard.front,
            back: genCard.back,
            hint: genCard.hint,
            tags: genCard.tags || [],
          });
        }
        setIsAiModalOpen(false);
        setAiNotes('');
        loadData();
        onRefreshSubjects();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredCards = cards.filter(
    (c) =>
      c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      id="subject-details-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
              style={{ backgroundColor: subject.color || '#8BC34A' }}
            >
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                  {subject.title}
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {cards.length} Cards
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xl line-clamp-1">
                {subject.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Study Quick Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 py-3 sm:py-4 shrink-0 border-b border-stone-100 dark:border-stone-800">
          <button
            onClick={() => {
              onClose();
              onStartReview(subject);
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
            <span>Active Recall</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartLearn(subject);
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-xs font-bold cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
            <span>Learn Quiz</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartMatch(subject);
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-950/60 border border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-300 text-xs font-bold cursor-pointer"
          >
            <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />
            <span>Speed Match</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartTest(subject);
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300 text-xs font-bold cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Practice Test</span>
          </button>
          
          <button
            onClick={() => {
              onClose();
              onHostMultiplayer(subject);
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-xs font-bold cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />
            <span>Host Kahoot</span>
          </button>
          
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-300 text-xs font-bold cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Toolbar: Search, Add Card, AI Generator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 py-2.5 sm:py-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8BC34A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV / Excel</span>
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300 text-xs font-bold cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Generate with AI</span>
            </button>

            <button
              onClick={() => setIsAddingCard(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
          </div>
        </div>

        {/* Import Notification Banner */}
        {importNotification && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {importNotification}
            </span>
            <button
              onClick={() => setImportNotification(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add Card Drawer/Form */}
        {isAddingCard && (
          <form
            onSubmit={handleCreateCard}
            className="p-4 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200/80 dark:border-stone-700 mb-3 space-y-3 shrink-0 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Create New Flashcard
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block mb-1">
                  Prompt (Front)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. What is the time complexity of QuickSort?"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block mb-1">
                  Answer (Back)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. O(n log n) average, O(n^2) worst case with bad pivot."
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block mb-1">
                  Hint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Think about recursion tree"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. algorithms, sorting"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Flashcard
              </button>
            </div>
          </form>
        )}

        {/* Cards Scrollable Table/List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-stone-400">Loading cards...</div>
          ) : filteredCards.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No cards match your search.
            </div>
          ) : (
            filteredCards.map((card, idx) => (
              <div
                key={card.id}
                className="p-3.5 sm:p-4 bg-stone-50/70 dark:bg-stone-800/50 hover:bg-stone-100/70 dark:hover:bg-stone-800 border border-stone-200/70 dark:border-stone-750 rounded-2xl transition-all flex items-start justify-between gap-3 sm:gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100 truncate">
                      {card.front}
                    </span>
                    {((card as any)._isOffline || (card as any)._syncStatus === 'pending_create') && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                        Pending Sync
                      </span>
                    )}
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 pl-7 leading-relaxed">{card.back}</p>
                  {card.hint && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 italic pl-7 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      <span>{card.hint}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-7 pt-1 text-[10px] text-stone-400 dark:text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Interval: {formatInterval(card.intervalDays)}
                    </span>
                    <span>Reps: {card.repetitions}</span>
                    <span>Diff: {card.difficulty.toFixed(1)}</span>
                    {card.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-1.5 py-0.2 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingCard(card)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Flashcard Generator Modal Sub-view */}
        {isAiModalOpen && (
          <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-100 dark:border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    AI Flashcard Generator
                  </h3>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Topic or Concept
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Distributed Consensus & Raft Algorithm"
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Paste Lecture Notes or Syllabus (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                    placeholder="Paste article excerpt, chapter outline, or key terms to extract atomic cards from..."
                    className="w-full p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    Number of cards to generate:
                  </span>
                  <select
                    value={aiCardCount}
                    onChange={(e) => setAiCardCount(Number(e.target.value))}
                    className="p-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-800 dark:text-stone-100"
                  >
                    <option value={3}>3 Cards</option>
                    <option value={5}>5 Cards</option>
                    <option value={8}>8 Cards</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-600 dark:text-stone-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={isGenerating || !aiTopic.trim()}
                  onClick={handleGenerateAI}
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Flashcards'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV/Excel Import Modal */}
        <ImportCardsModal
          subject={subject}
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={(count) => {
            setImportNotification(`Successfully imported ${count} cards from spreadsheet!`);
            loadData();
            onRefreshSubjects();
          }}
        />

        {/* Schedule Modal */}
        {isScheduleModalOpen && (
          <SubjectScheduleModal
            subject={subject}
            onClose={() => setIsScheduleModalOpen(false)}
            onUpdate={onRefreshSubjects}
          />
        )}
      </div>
    </div>
  );
};
