import { BrowserRouter } from 'react-router-dom';
import { registerServiceWorker } from './serviceWorkerRegistration';
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { StudyPomodoroView } from './components/StudyPomodoroView';
import { WelcomeTourModal } from './components/WelcomeTourModal';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';

import { Shelf, Subject, Card, UserProfile, Grade } from './types';
import { ApiService } from './services/api';
import { ThemeId, applyTheme, getSavedTheme, saveTheme } from './utils/theme';
import { syncManager } from './services/syncManager';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { Layout } from './components/ui/Layout';

export const App: React.FC = () => {
  React.useEffect(() => { registerServiceWorker(); }, []);
  // Authentication & Profile State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Tour State
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('oopsly_has_seen_tour') === 'true';
  });

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getSavedTheme);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

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

  // Active Modals / Interactive Sub-screens
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

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-stone-200 border-t-[var(--theme-accent)] rounded-full animate-spin"></div>
          <span className="text-stone-500 font-bold text-sm animate-pulse">Loading Oopsly...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showAuthPage) {
      return (
        <AuthPage
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            setShowAuthPage(false);
            loadShelvesAndSubjects();
          }}
        />
      );
    }
    return <LandingPage onLoginClick={() => setShowAuthPage(true)} />;
  }

  return (
    <BrowserRouter>
    
      <Layout
        user={user}
        onOpenNewShelf={() => {
          setEditingShelf(null);
          setIsShelfModalOpen(true);
        }}
        modals={
          <>

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
          dailyGoal={user?.settings?.dailyGoal || 20}
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

      {/* Theme Switcher Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onClose={() => setIsThemeModalOpen(false)}
      />

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
              </>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/library" element={
            <LibraryShelvesView
              user={user!}
              onUpdateUser={setUser}
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
          } />
          
          <Route path="/study" element={
            <StudyPomodoroView
              subjects={subjects}
              onRewardXp={handleRewardXp}
              onRefreshData={loadShelvesAndSubjects}
            />
          } />

          <Route path="/discover" element={
            <DiscoverCatalog
              shelves={shelves}
              onCloneSuccess={() => {
                loadShelvesAndSubjects();
              }}
            />
          } />

          <Route path="/stats" element={<StatsDashboard />} />
          <Route path="/leaderboard" element={<LeaderboardView currentUser={user || undefined} />} />
          
          <Route path="/settings" element={
            <ProfileSettingsModal
              user={user}
              onUpdateUser={setUser}
              onOpenThemeModal={() => setIsThemeModalOpen(true)}
              onLogout={handleLogout}
            />
          } />

          <Route path="/subscribe" element={
            <SubscriptionPage onClose={() => window.history.back()} />
          } />

          <Route path="*" element={<Navigate to="/library" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};
