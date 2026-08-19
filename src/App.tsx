import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LibraryShelvesView } from './components/LibraryShelvesView';
import { FlashcardReview } from './components/FlashcardReview';
import { ReviewCompleteScreen } from './components/ReviewCompleteScreen';
import { LearnModeModal } from './components/LearnModeModal';
import { MatchingGameModal } from './components/MatchingGameModal';
import { TestSuiteModal } from './components/TestSuiteModal';
import { SubjectDetailsModal } from './components/SubjectDetailsModal';
import { DiscoverCatalog } from './components/DiscoverCatalog';
import { StatsDashboard } from './components/StatsDashboard';
import { LeaderboardView } from './components/LeaderboardView';
import { ShelvesManager } from './components/ShelvesManager';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { ShelfModal } from './components/ShelfModal';
import { SubjectModal } from './components/SubjectModal';
import { ThemeModal } from './components/ThemeModal';
import { AuthModal } from './components/AuthModal';
import { StudyPomodoroView } from './components/StudyPomodoroView';
import { WelcomeTourModal } from './components/WelcomeTourModal';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';

import { Shelf, Subject, Card, UserProfile, Grade } from './types';
import { ApiService } from './services/api';
import { ThemeId, applyTheme, getSavedTheme, saveTheme } from './utils/theme';
import { syncManager } from './services/syncManager';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';

export const App: React.FC = () => {
  // Authentication & Profile State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Tour State
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('oopsly_has_seen_tour') === 'true';
  });

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getSavedTheme);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'library' | 'study' | 'discover' | 'stats' | 'leaderboard'>('library');

  // Shelves and subjects
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Modals / Interactive Sub-screens
  const [activeReviewSession, setActiveReviewSession] = useState<{
    subject: Subject;
    cards: Card[];
  } | null>(null);

  const [reviewStatsComplete, setReviewStatsComplete] = useState<{
    subject: Subject;
    stats: {
      totalReviewed: number;
      xpEarned: number;
      gradeCounts: Record<Grade, number>;
    };
  } | null>(null);

  const [activeLearnSession, setActiveLearnSession] = useState<{
    subject: Subject;
    cards: Card[];
  } | null>(null);

  const [activeMatchSession, setActiveMatchSession] = useState<{
    subject: Subject;
    cards: Card[];
  } | null>(null);

  const [activeTestSession, setActiveTestSession] = useState<{
    subject: Subject;
  } | null>(null);
  
  const [activeMultiplayerSession, setActiveMultiplayerSession] = useState<{
    mode: 'HOST' | 'JOIN';
    subject?: Subject;
    cards?: Card[];
  } | null>(null);

  const [activeDetailsSubject, setActiveDetailsSubject] = useState<Subject | null>(null);

  // Management modals
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectModalShelfId, setSubjectModalShelfId] = useState<string>('');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    saveTheme(themeId);
    applyTheme(themeId);
  };

  // Fetch initial profile & data
  const loadUserData = useCallback(async () => {
    const profileRes = await ApiService.getProfile();
    if (profileRes.isSuccess && profileRes.data) {
      setUser(profileRes.data);
    }
  }, []);

  const loadShelvesAndSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const shelvesRes = await ApiService.getShelves();
      if (shelvesRes.isSuccess && shelvesRes.data) {
        const fetchedShelves = shelvesRes.data;
        setShelves(fetchedShelves);

        // Fetch subjects for all shelves
        const allSubjectsPromises = fetchedShelves.map((s) => ApiService.getShelfSubjects(s.id));
        const responses = await Promise.all(allSubjectsPromises);
        const aggregatedSubjects: Subject[] = [];
        responses.forEach((res) => {
          if (res.isSuccess && res.data) {
            aggregatedSubjects.push(...res.data);
          }
        });
        setSubjects(aggregatedSubjects);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncManager.init();
    loadUserData();
    loadShelvesAndSubjects();
  }, [loadUserData, loadShelvesAndSubjects]);

  // Shelf CRUD
  const handleSaveShelf = async (data: { name: string; description?: string; color?: string; icon?: string }) => {
    if (editingShelf) {
      await ApiService.updateShelf(editingShelf.id, data);
    } else {
      await ApiService.createShelf(data);
    }
    loadShelvesAndSubjects();
  };

  const handleDeleteShelf = async (shelfId: string) => {
    await ApiService.deleteShelf(shelfId);
    if (selectedShelfId === shelfId) {
      setSelectedShelfId(null);
    }
    loadShelvesAndSubjects();
  };

  // Subject CRUD
  const handleSaveSubject = async (data: {
    title: string;
    description?: string;
    color?: string;
    tags?: string[];
    shelfId?: string;
  }) => {
    if (editingSubject) {
      await ApiService.updateSubject(editingSubject.id, data);
    } else {
      const targetShelfId = data.shelfId || subjectModalShelfId || selectedShelfId || shelves[0]?.id;
      if (targetShelfId) {
        await ApiService.createSubject(targetShelfId, data);
      }
    }
    loadShelvesAndSubjects();
  };

  const handleDeleteSubject = async (subjectId: string) => {
    await ApiService.deleteSubject(subjectId);
    loadShelvesAndSubjects();
  };

  // Launch Active Recall Review
  const handleStartReview = async (subject: Subject) => {
    const res = await ApiService.getSubjectCards(subject.id);
    if (res.isSuccess && res.data && res.data.length > 0) {
      setActiveReviewSession({
        subject,
        cards: res.data,
      });
    }
  };

  // Launch Learn Mode Quiz
  const handleStartLearn = async (subject: Subject) => {
    const res = await ApiService.getSubjectCards(subject.id);
    if (res.isSuccess && res.data && res.data.length > 0) {
      setActiveLearnSession({
        subject,
        cards: res.data,
      });
    }
  };

  // Launch Matching Game
  const handleStartMatch = async (subject: Subject) => {
    const res = await ApiService.getSubjectCards(subject.id);
    if (res.isSuccess && res.data && res.data.length > 0) {
      setActiveMatchSession({
        subject,
        cards: res.data,
      });
    }
  };

  // Launch Test Suite
  const handleStartTest = (subject: Subject) => {
    setActiveTestSession({ subject });
  };

  // Grade card in active recall session
  const handleGradeCard = async (cardId: string, grade: Grade) => {
    const res = await ApiService.gradeCard(cardId, grade);
    if (res.isSuccess && res.data) {
      if (user) {
        setUser((prev) => (prev ? { ...prev, xp: res.data!.totalXp } : null));
      }
      return { xpGained: res.data.xpGained };
    }
    return { xpGained: grade === 4 ? 20 : grade === 3 ? 15 : grade === 2 ? 10 : 5 };
  };

  const handleRewardXp = (xpGained: number) => {
    if (user) {
      setUser((prev) => (prev ? { ...prev, xp: prev.xp + xpGained } : null));
    }
  };

  // Launch Multiplayer Kahoot
  const handleHostMultiplayer = async (subject: Subject) => {
    const res = await ApiService.getSubjectCards(subject.id);
    if (res.isSuccess && res.data && res.data.length > 0) {
      setActiveMultiplayerSession({
        mode: 'HOST',
        subject,
        cards: res.data
      });
    }
  };

  const handleJoinMultiplayer = () => {
    setActiveMultiplayerSession({
      mode: 'JOIN'
    });
  };

  return (
    <div
      id="app-root-container"
      className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col font-sans selection:bg-[var(--theme-accent)]/30 transition-colors"
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
      }}
    >
      {/* Top Header Navbar */}
      {user && (
        <Navbar
          user={user}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenNewShelf={() => {
            setEditingShelf(null);
            setIsShelfModalOpen(true);
          }}
          onOpenSettings={() => setIsProfileModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'library' && (
          <LibraryShelvesView
            shelves={shelves}
            subjects={subjects}
            selectedShelfId={selectedShelfId}
            onSelectShelf={setSelectedShelfId}
            onOpenNewShelf={() => {
              setEditingShelf(null);
              setIsShelfModalOpen(true);
            }}
            onOpenEditShelf={(shelf) => {
              setEditingShelf(shelf);
              setIsShelfModalOpen(true);
            }}
            onDeleteShelf={handleDeleteShelf}
            onOpenNewSubject={(shelfId) => {
              setSubjectModalShelfId(shelfId);
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            onOpenEditSubject={(subj) => {
              setEditingSubject(subj);
              setSubjectModalShelfId(subj.shelfId);
              setIsSubjectModalOpen(true);
            }}
            onDeleteSubject={handleDeleteSubject}
            onStartReview={handleStartReview}
            onStartLearnMode={handleStartLearn}
            onStartMatchGame={handleStartMatch}
            onStartTestSuite={handleStartTest}
            onViewSubjectDetails={setActiveDetailsSubject}
            onJoinMultiplayer={handleJoinMultiplayer}
            onRefreshData={loadShelvesAndSubjects}
          />
        )}

        {activeTab === 'study' && (
          <StudyPomodoroView
            subjects={subjects}
            onRewardXp={handleRewardXp}
            onRefreshData={loadShelvesAndSubjects}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverCatalog
            shelves={shelves}
            onCloneSuccess={() => {
              loadShelvesAndSubjects();
              setActiveTab('library');
            }}
          />
        )}

        {activeTab === 'stats' && <StatsDashboard />}

        {activeTab === 'leaderboard' && <LeaderboardView currentUser={user || undefined} />}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200/60 dark:border-stone-800/60 text-center text-xs text-stone-400">
        <p>© 2026 Oopsly · Spaced Repetition Flashcards with FSRS Algorithm & Collaborative Communities</p>
      </footer>

      {/* Full-screen Flashcard Review Mode */}
      {activeReviewSession && (
        <FlashcardReview
          subject={activeReviewSession.subject}
          cards={activeReviewSession.cards}
          onClose={() => {
            setActiveReviewSession(null);
            loadShelvesAndSubjects();
          }}
          onGradeCard={handleGradeCard}
          onFinishSession={(stats) => {
            const subject = activeReviewSession.subject;
            setActiveReviewSession(null);
            setReviewStatsComplete({ subject, stats });
            loadShelvesAndSubjects();
          }}
        />
      )}

      {/* Session Complete Celebration Recap */}
      {reviewStatsComplete && (
        <ReviewCompleteScreen
          subject={reviewStatsComplete.subject}
          stats={reviewStatsComplete.stats}
          onReturnToShelf={() => setReviewStatsComplete(null)}
          onPracticeAgain={() => {
            const subject = reviewStatsComplete.subject;
            setReviewStatsComplete(null);
            handleStartReview(subject);
          }}
        />
      )}

      {/* Learn Mode Quiz Modal */}
      {activeLearnSession && (
        <LearnModeModal
          subject={activeLearnSession.subject}
          cards={activeLearnSession.cards}
          onClose={() => setActiveLearnSession(null)}
          onRewardXp={handleRewardXp}
        />
      )}

      {/* Speed Matching Game Modal */}
      {activeMatchSession && (
        <MatchingGameModal
          subject={activeMatchSession.subject}
          cards={activeMatchSession.cards}
          onClose={() => setActiveMatchSession(null)}
          onRewardXp={handleRewardXp}
        />
      )}

      {/* Practice Test Assessment Modal */}
      {activeTestSession && (
        <TestSuiteModal
          subject={activeTestSession.subject}
          onClose={() => setActiveTestSession(null)}
          onRewardXp={handleRewardXp}
        />
      )}

      {/* Multiplayer Kahoot Game Modal */}
      {activeMultiplayerSession && user && (
        <MultiplayerLobbyModal
          user={user}
          mode={activeMultiplayerSession.mode}
          hostSubject={activeMultiplayerSession.subject}
          hostCards={activeMultiplayerSession.cards}
          onClose={() => setActiveMultiplayerSession(null)}
        />
      )}

      {/* Subject Deck Card Details & AI Generator Modal */}
      {activeDetailsSubject && (
        <SubjectDetailsModal
          subject={activeDetailsSubject}
          onClose={() => setActiveDetailsSubject(null)}
          onStartReview={handleStartReview}
          onStartLearn={handleStartLearn}
          onStartMatch={handleStartMatch}
          onStartTest={handleStartTest}
          onHostMultiplayer={handleHostMultiplayer}
          onRefreshSubjects={loadShelvesAndSubjects}
        />
      )}

      {/* Create / Edit Shelf Modal */}
      {isShelfModalOpen && (
        <ShelfModal
          shelf={editingShelf}
          onClose={() => {
            setIsShelfModalOpen(false);
            setEditingShelf(null);
          }}
          onSave={handleSaveShelf}
        />
      )}

      {/* Create / Edit Subject Deck Modal */}
      {isSubjectModalOpen && (
        <SubjectModal
          shelfId={subjectModalShelfId || selectedShelfId || shelves[0]?.id}
          shelves={shelves}
          subject={editingSubject}
          onClose={() => {
            setIsSubjectModalOpen(false);
            setEditingSubject(null);
          }}
          onSave={handleSaveSubject}
        />
      )}

      {/* Profile & Settings Modal */}
      {isProfileModalOpen && user && (
        <ProfileSettingsModal
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateUser={(updated) => setUser(updated)}
          onLogout={() => {
            setIsProfileModalOpen(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Theme Switcher Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            setIsAuthModalOpen(false);
            loadShelvesAndSubjects();
          }}
        />
      )}

      {/* Offline Status & Background Sync Banner */}
      <OfflineSyncBanner
        onDataSynced={() => {
          loadUserData();
          loadShelvesAndSubjects();
        }}
      />

      {/* Onboarding Tour Modal */}
      {!hasSeenTour && !isLoading && (
        <WelcomeTourModal 
          onClose={() => {
            setHasSeenTour(true);
            localStorage.setItem('oopsly_has_seen_tour', 'true');
          }}
        />
      )}
    </div>
  );
};
