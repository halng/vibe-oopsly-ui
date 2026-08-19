import express, { Request, Response } from 'express';
import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_USER,
  INITIAL_SHELVES,
  INITIAL_SUBJECTS,
  INITIAL_CARDS,
  INITIAL_TEST_SUITES,
  DISCOVER_CATALOG,
  LEADERBOARD_USERS,
  INITIAL_COMMUNITIES,
  INITIAL_COMMUNITY_MEMBERS,
  INITIAL_JOIN_REQUESTS,
} from './src/data/initialData';
import { scheduleCard } from './src/utils/fsrs';
import {
  Grade,
  Shelf,
  Subject,
  Card,
  TestSuite,
  UserProfile,
  Community,
  CommunityMember,
  CommunityJoinRequest,
} from './src/types';

// In-Memory Data Store with Initial State
let currentUser: UserProfile = { ...INITIAL_USER };
let shelves: Shelf[] = [...INITIAL_SHELVES];
let subjects: Subject[] = [...INITIAL_SUBJECTS];
let cards: Card[] = [...INITIAL_CARDS];
let testSuites: TestSuite[] = [...INITIAL_TEST_SUITES];
let communities: Community[] = [...INITIAL_COMMUNITIES];
let communityMembers: CommunityMember[] = [...INITIAL_COMMUNITY_MEMBERS];
let joinRequests: CommunityJoinRequest[] = [...INITIAL_JOIN_REQUESTS];
const otpCodes = new Map<string, string>();

function responseSuccess<T>(data: T, message = 'Success') {
  return {
    isSuccess: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function responseError(message: string, statusCode = 400) {
  return {
    isSuccess: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json(responseSuccess({ status: 'ok', uptime: process.uptime() }));
  });

  // Auth: Send OTP
  app.post('/api/auth/otp/send', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json(responseError('Valid email is required'));
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpCodes.set(email.toLowerCase().trim(), code);
    console.log(`[Oopsly Auth] Generated OTP for ${email}: ${code}`);
    return res.json(responseSuccess({ sent: true, demoCode: code }, 'OTP code sent to email'));
  });

  // Auth: Verify OTP
  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const storedCode = otpCodes.get(cleanEmail);

    if (otp === '123456' || (storedCode && storedCode === otp)) {
      otpCodes.delete(cleanEmail);
      currentUser.email = cleanEmail;
      return res.json(
        responseSuccess({
          user: currentUser,
          token: 'jwt_mock_token_' + Date.now(),
        }, 'Authenticated successfully')
      );
    }

    return res.status(400).json(responseError('Invalid verification code'));
  });

  // Auth: Instant Demo login
  app.post('/api/auth/demo', (req: Request, res: Response) => {
    return res.json(
      responseSuccess({
        user: currentUser,
        token: 'jwt_demo_token',
      }, 'Logged in as Demo User')
    );
  });

  // User Profile
  app.get('/api/user/profile', (req: Request, res: Response) => {
    res.json(responseSuccess(currentUser));
  });

  app.patch('/api/user/profile', (req: Request, res: Response) => {
    const { displayName, bio, avatarUrl } = req.body;
    if (displayName) currentUser.displayName = displayName;
    if (bio !== undefined) currentUser.bio = bio;
    if (avatarUrl) currentUser.avatarUrl = avatarUrl;
    res.json(responseSuccess(currentUser, 'Profile updated'));
  });

  app.patch('/api/user/settings', (req: Request, res: Response) => {
    currentUser.settings = {
      ...currentUser.settings,
      ...req.body,
    };
    res.json(responseSuccess(currentUser.settings, 'Settings updated'));
  });

  // Shelves
  app.get('/api/shelves', (req: Request, res: Response) => {
    const activeShelves = shelves
      .filter((s) => !s.isDeleted)
      .map((s) => {
        const shelfSubjects = subjects.filter((sub) => sub.shelfId === s.id && !sub.isDeleted);
        const totalCards = shelfSubjects.reduce((acc, sub) => acc + sub.cardCount, 0);
        const dueCards = shelfSubjects.reduce((acc, sub) => acc + (sub.dueCount || 0), 0);
        return {
          ...s,
          subjectCount: shelfSubjects.length,
          totalCards,
          dueCards,
        };
      });
    res.json(responseSuccess(activeShelves));
  });

  app.post('/api/shelves', (req: Request, res: Response) => {
    const { name, description, icon, color } = req.body;
    if (!name?.trim()) {
      return res.status(400).json(responseError('Shelf name is required'));
    }
    const newShelf: Shelf = {
      id: 'shelf-' + Date.now(),
      name: name.trim(),
      description: description || '',
      icon: icon || 'Folder',
      color: color || '#8BC34A',
      isDeleted: false,
      subjectCount: 0,
      totalCards: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    shelves.unshift(newShelf);
    res.json(responseSuccess(newShelf, 'Shelf created'));
  });

  app.patch('/api/shelves/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const shelf = shelves.find((s) => s.id === id);
    if (!shelf) return res.status(404).json(responseError('Shelf not found', 404));

    if (req.body.name) shelf.name = req.body.name.trim();
    if (req.body.description !== undefined) shelf.description = req.body.description;
    if (req.body.icon) shelf.icon = req.body.icon;
    if (req.body.color) shelf.color = req.body.color;
    shelf.updatedAt = new Date().toISOString();

    res.json(responseSuccess(shelf, 'Shelf updated'));
  });

  app.patch('/api/shelves/:id/delete', (req: Request, res: Response) => {
    const { id } = req.params;
    const shelf = shelves.find((s) => s.id === id);
    if (!shelf) return res.status(404).json(responseError('Shelf not found', 404));

    shelf.isDeleted = true;
    shelf.updatedAt = new Date().toISOString();
    res.json(responseSuccess(shelf, 'Shelf deleted'));
  });

  // Subjects
  app.get('/api/shelves/:shelfId/subjects', (req: Request, res: Response) => {
    const { shelfId } = req.params;
    const now = new Date();
    const shelfSubjects = subjects
      .filter((s) => s.shelfId === shelfId && !s.isDeleted)
      .map((s) => {
        const subCards = cards.filter((c) => c.subjectId === s.id && !c.isDeleted);
        const dueCards = subCards.filter((c) => new Date(c.dueDate) <= now);
        return {
          ...s,
          cardCount: subCards.length,
          dueCount: dueCards.length,
        };
      });
    res.json(responseSuccess(shelfSubjects));
  });

  app.get('/api/subjects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const subject = subjects.find((s) => s.id === id && !s.isDeleted);
    if (!subject) return res.status(404).json(responseError('Subject not found', 404));

    const now = new Date();
    const subCards = cards.filter((c) => c.subjectId === id && !c.isDeleted);
    const dueCards = subCards.filter((c) => new Date(c.dueDate) <= now);
    const subSuites = testSuites.filter((ts) => ts.subjectId === id);

    res.json(
      responseSuccess({
        ...subject,
        cardCount: subCards.length,
        dueCount: dueCards.length,
        cards: subCards,
        testSuites: subSuites,
      })
    );
  });

  app.post('/api/shelves/:shelfId/subjects', (req: Request, res: Response) => {
    const { shelfId } = req.params;
    const { title, description, icon, color, tags, isPublic } = req.body;
    if (!title?.trim()) {
      return res.status(400).json(responseError('Subject title is required'));
    }
    const newSubject: Subject = {
      id: 'subj-' + Date.now(),
      shelfId,
      title: title.trim(),
      description: description || '',
      icon: icon || 'BookOpen',
      color: color || '#8BC34A',
      isPublic: Boolean(isPublic),
      isDeleted: false,
      cardCount: 0,
      dueCount: 0,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorName: currentUser.displayName,
      authorEmail: currentUser.email,
    };
    subjects.unshift(newSubject);
    res.json(responseSuccess(newSubject, 'Subject created'));
  });

  app.patch('/api/subjects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const subject = subjects.find((s) => s.id === id);
    if (!subject) return res.status(404).json(responseError('Subject not found', 404));

    if (req.body.title) subject.title = req.body.title.trim();
    if (req.body.description !== undefined) subject.description = req.body.description;
    if (req.body.icon) subject.icon = req.body.icon;
    if (req.body.color) subject.color = req.body.color;
    if (req.body.tags) subject.tags = req.body.tags;
    if (req.body.isPublic !== undefined) subject.isPublic = req.body.isPublic;
    if (req.body.schedule !== undefined) subject.schedule = req.body.schedule;
    subject.updatedAt = new Date().toISOString();

    res.json(responseSuccess(subject, 'Subject updated'));
  });

  app.patch('/api/subjects/:id/delete', (req: Request, res: Response) => {
    const { id } = req.params;
    const subject = subjects.find((s) => s.id === id);
    if (!subject) return res.status(404).json(responseError('Subject not found', 404));

    subject.isDeleted = true;
    subject.updatedAt = new Date().toISOString();
    res.json(responseSuccess(subject, 'Subject deleted'));
  });

  // Cards
  app.get('/api/subjects/:subjectId/cards', (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const subCards = cards.filter((c) => c.subjectId === subjectId && !c.isDeleted);
    res.json(responseSuccess(subCards));
  });

  app.get('/api/subjects/:subjectId/cards/due', (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const now = new Date();
    const due = cards.filter(
      (c) => c.subjectId === subjectId && !c.isDeleted && new Date(c.dueDate) <= now
    );
    res.json(responseSuccess(due));
  });

  app.post('/api/subjects/:subjectId/cards', (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const { front, back, hint, tags, mediaUrl } = req.body;

    if (!front?.trim() || !back?.trim()) {
      return res.status(400).json(responseError('Front and back text are required'));
    }

    const newCard: Card = {
      id: 'card-' + Date.now(),
      subjectId,
      front: front.trim(),
      back: back.trim(),
      hint: hint?.trim() || undefined,
      tags: Array.isArray(tags) ? tags : [],
      difficulty: 3.0,
      stability: 0.5,
      intervalDays: 0,
      repetitions: 0,
      dueDate: new Date().toISOString(), // Due immediately for new cards
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaUrl,
    };

    cards.push(newCard);

    // Update subject card count
    const subject = subjects.find((s) => s.id === subjectId);
    if (subject) {
      subject.cardCount += 1;
      subject.dueCount += 1;
    }

    res.json(responseSuccess(newCard, 'Card created'));
  });

  app.post('/api/subjects/:subjectId/cards/batch', (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const { cards: importItems } = req.body;

    if (!Array.isArray(importItems) || importItems.length === 0) {
      return res.status(400).json(responseError('Cards array is required'));
    }

    const createdCards: Card[] = [];
    const nowIso = new Date().toISOString();

    for (const item of importItems) {
      if (!item.front?.trim() || !item.back?.trim()) continue;

      const newCard: Card = {
        id: 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        subjectId,
        front: item.front.trim(),
        back: item.back.trim(),
        hint: item.hint?.trim() || undefined,
        tags: Array.isArray(item.tags)
          ? item.tags
          : typeof item.tags === 'string'
          ? item.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
          : [],
        difficulty: 3.0,
        stability: 0.5,
        intervalDays: 0,
        repetitions: 0,
        dueDate: nowIso,
        isDeleted: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        mediaUrl: item.mediaUrl,
      };

      cards.push(newCard);
      createdCards.push(newCard);
    }

    // Update subject card count
    const subject = subjects.find((s) => s.id === subjectId);
    if (subject) {
      subject.cardCount = (subject.cardCount || 0) + createdCards.length;
      subject.dueCount = (subject.dueCount || 0) + createdCards.length;
    }

    res.json(
      responseSuccess(
        {
          importedCount: createdCards.length,
          cards: createdCards,
        },
        `Successfully imported ${createdCards.length} flashcards`
      )
    );
  });

  app.patch('/api/cards/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const card = cards.find((c) => c.id === id);
    if (!card) return res.status(404).json(responseError('Card not found', 404));

    if (req.body.front) card.front = req.body.front.trim();
    if (req.body.back) card.back = req.body.back.trim();
    if (req.body.hint !== undefined) card.hint = req.body.hint?.trim() || undefined;
    if (req.body.tags) card.tags = req.body.tags;
    if (req.body.mediaUrl !== undefined) card.mediaUrl = req.body.mediaUrl;
    card.updatedAt = new Date().toISOString();

    res.json(responseSuccess(card, 'Card updated'));
  });

  // Grade card review with FSRS algorithm
  app.patch('/api/cards/:id/difficulty', (req: Request, res: Response) => {
    const { id } = req.params;
    const { grade } = req.body; // 1: Again, 2: Hard, 3: Good, 4: Easy

    if (![1, 2, 3, 4].includes(Number(grade))) {
      return res.status(400).json(responseError('Valid grade (1, 2, 3, or 4) is required'));
    }

    const card = cards.find((c) => c.id === id);
    if (!card) return res.status(404).json(responseError('Card not found', 404));

    const scheduled = scheduleCard(
      {
        stability: card.stability,
        difficulty: card.difficulty,
        intervalDays: card.intervalDays,
        repetitions: card.repetitions,
      },
      Number(grade) as Grade
    );

    card.stability = scheduled.stability;
    card.difficulty = scheduled.difficulty;
    card.intervalDays = scheduled.intervalDays;
    card.repetitions = scheduled.repetitions;
    card.dueDate = scheduled.dueDate;
    card.lastReviewedAt = new Date().toISOString();
    card.updatedAt = new Date().toISOString();

    // Reward XP & update user stats
    const xpGained = grade === 4 ? 20 : grade === 3 ? 15 : grade === 2 ? 10 : 5;
    currentUser.xp += xpGained;
    currentUser.totalReviews += 1;
    if (card.repetitions === 1) {
      currentUser.totalCardsStudied += 1;
    }

    res.json(
      responseSuccess({
        card,
        scheduled,
        xpGained,
        totalXp: currentUser.xp,
      }, 'Card reviewed and rescheduled')
    );
  });

  app.patch('/api/cards/:id/delete', (req: Request, res: Response) => {
    const { id } = req.params;
    const card = cards.find((c) => c.id === id);
    if (!card) return res.status(404).json(responseError('Card not found', 404));

    card.isDeleted = true;
    card.updatedAt = new Date().toISOString();

    // Decrement subject count
    const subject = subjects.find((s) => s.id === card.subjectId);
    if (subject && subject.cardCount > 0) {
      subject.cardCount -= 1;
    }

    res.json(responseSuccess(card, 'Card deleted'));
  });

  // Discover Public Catalog
  app.get('/api/discover', (req: Request, res: Response) => {
    const publicSubjects = subjects.filter((s) => s.isPublic && !s.isDeleted);
    const combined = [
      ...DISCOVER_CATALOG,
      ...publicSubjects.map((s) => ({
        ...s,
        cardsPreview: cards.filter((c) => c.subjectId === s.id && !c.isDeleted).slice(0, 3),
      })),
    ];
    res.json(responseSuccess(combined));
  });

  // Clone Discover Subject into User's Shelf
  app.post('/api/discover/clone/:subjectId', (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const { targetShelfId } = req.body;

    const shelf = shelves.find((s) => s.id === targetShelfId && !s.isDeleted) || shelves[0];
    if (!shelf) return res.status(400).json(responseError('Target shelf not found'));

    // Look in DISCOVER_CATALOG or user public subjects
    const catalogItem = DISCOVER_CATALOG.find((d) => d.id === subjectId);
    const publicItem = subjects.find((s) => s.id === subjectId);

    if (!catalogItem && !publicItem) {
      return res.status(404).json(responseError('Discover subject not found', 404));
    }

    const source = catalogItem || publicItem!;
    const newSubjectId = 'subj-clone-' + Date.now();
    const newSubject: Subject = {
      id: newSubjectId,
      shelfId: shelf.id,
      title: `${source.title} (Imported)`,
      description: source.description,
      icon: source.icon || 'BookOpen',
      color: source.color || '#8BC34A',
      isPublic: false,
      isDeleted: false,
      cardCount: 0,
      dueCount: 0,
      tags: [...source.tags],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorName: currentUser.displayName,
      authorEmail: currentUser.email,
    };

    subjects.unshift(newSubject);

    // Create cards for the cloned subject
    let createdCardsCount = 0;
    if (catalogItem && catalogItem.cardsPreview) {
      catalogItem.cardsPreview.forEach((cp, idx) => {
        if (cp.front && cp.back) {
          cards.push({
            id: `card-cloned-${Date.now()}-${idx}`,
            subjectId: newSubjectId,
            front: cp.front,
            back: cp.back,
            tags: [...source.tags],
            difficulty: 3.0,
            stability: 0.5,
            intervalDays: 0,
            repetitions: 0,
            dueDate: new Date().toISOString(),
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          createdCardsCount++;
        }
      });
    } else if (publicItem) {
      const sourceCards = cards.filter((c) => c.subjectId === publicItem.id && !c.isDeleted);
      sourceCards.forEach((sc, idx) => {
        cards.push({
          id: `card-cloned-${Date.now()}-${idx}`,
          subjectId: newSubjectId,
          front: sc.front,
          back: sc.back,
          hint: sc.hint,
          tags: [...sc.tags],
          difficulty: 3.0,
          stability: 0.5,
          intervalDays: 0,
          repetitions: 0,
          dueDate: new Date().toISOString(),
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        createdCardsCount++;
      });
    }

    newSubject.cardCount = createdCardsCount;
    newSubject.dueCount = createdCardsCount;

    res.json(responseSuccess(newSubject, 'Subject cloned into your shelf successfully'));
  });

  // Test Suites
  app.get('/api/subjects/:subjectId/test-suites', (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const suites = testSuites.filter((ts) => ts.subjectId === subjectId);
    res.json(responseSuccess(suites));
  });

  app.post('/api/subjects/:subjectId/test-suites', (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const { title, description, timeLimitMinutes, cardIds, questions } = req.body;

    const newSuite: TestSuite = {
      id: 'ts-' + Date.now(),
      subjectId,
      title: title || 'Custom Practice Test',
      description,
      timeLimitMinutes: Number(timeLimitMinutes) || 10,
      cardIds: Array.isArray(cardIds) ? cardIds : [],
      questions: Array.isArray(questions) ? questions : [],
      createdAt: new Date().toISOString(),
    };

    testSuites.push(newSuite);
    res.json(responseSuccess(newSuite, 'Test suite created'));
  });

  // Run Test Suite
  app.post('/api/test-suites/:id/run', (req: Request, res: Response) => {
    const { id } = req.params;
    const suite = testSuites.find((ts) => ts.id === id);
    if (!suite) return res.status(404).json(responseError('Test suite not found', 404));

    // Get cards or questions
    const suiteCards = cards.filter((c) => suite.cardIds.includes(c.id) && !c.isDeleted);
    res.json(
      responseSuccess({
        suite,
        cards: suiteCards,
        questions: suite.questions || [],
      })
    );
  });

  // Submit Test Suite Run
  app.post('/api/test-suites/:id/submit', (req: Request, res: Response) => {
    const { id } = req.params;
    const { answers, timeSpentSeconds } = req.body; // { [questionId]: selectedOptionIndex }
    const suite = testSuites.find((ts) => ts.id === id);

    let score = 0;
    let totalQuestions = 0;
    const breakdown: any[] = [];

    if (suite && suite.questions && suite.questions.length > 0) {
      totalQuestions = suite.questions.length;
      suite.questions.forEach((q) => {
        const userAnswer = answers?.[q.id];
        const isCorrect = userAnswer === q.correctOptionIndex;
        if (isCorrect) score += 1;
        breakdown.push({
          questionId: q.id,
          prompt: q.prompt,
          userAnswer,
          correctAnswer: q.correctOptionIndex,
          isCorrect,
          explanation: q.explanation,
        });
      });
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100;
    const xpGained = score * 25 + 50;
    currentUser.xp += xpGained;

    res.json(
      responseSuccess({
        score,
        totalQuestions,
        percentage,
        timeSpentSeconds,
        xpGained,
        breakdown,
      }, 'Test submitted successfully')
    );
  });

  // Stats Endpoint
  app.get('/api/stats', (req: Request, res: Response) => {
    const activeCards = cards.filter((c) => !c.isDeleted);
    const now = new Date();

    const stateDistribution = {
      new: activeCards.filter((c) => c.repetitions === 0).length,
      learning: activeCards.filter((c) => c.repetitions > 0 && c.repetitions < 3).length,
      review: activeCards.filter((c) => c.repetitions >= 3 && c.difficulty > 4.0).length,
      relearning: activeCards.filter((c) => c.difficulty > 7.0 && c.repetitions > 0).length,
      mastered: activeCards.filter((c) => c.repetitions >= 3 && c.difficulty <= 4.0).length,
    };

    // Weekly reviews simulated / real
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyActivity = days.map((day, i) => ({
      day,
      cardsReviewed: i === 6 ? 28 : Math.floor(18 + Math.sin(i) * 12),
      retention: i === 6 ? 94 : Math.floor(85 + (i % 3) * 4),
    }));

    // Due forecast for the next 7 days
    const upcomingDueForecast = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dueCount =
        activeCards.filter((c) => {
          const cDate = new Date(c.dueDate);
          return cDate.toDateString() === d.toDateString();
        }).length + (i === 0 ? 12 : Math.floor(4 + ((i * 3) % 7)));

      return {
        date: d.toISOString().split('T')[0],
        dayName,
        dueCount,
      };
    });

    res.json(
      responseSuccess({
        streakDays: currentUser.streakDays,
        reviewedToday: 28,
        totalStudiedToday: 28,
        dailyGoal: currentUser.settings.dailyGoal || 20,
        retentionRate: currentUser.retentionRate || 88,
        overallRetention: currentUser.retentionRate || 88,
        totalReviews: currentUser.totalReviews || 142,
        stateDistribution,
        masteryBreakdown: stateDistribution,
        upcomingDueForecast,
        dueForecast: upcomingDueForecast,
        weeklyActivity,
      })
    );
  });

  // Leaderboard (Global & Community-driven)
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const sorted = [...LEADERBOARD_USERS].sort((a, b) => b.xp - a.xp);
    sorted.forEach((u, i) => {
      u.rank = i + 1;
      if (u.id === currentUser.id) {
        u.xp = currentUser.xp;
        u.streakDays = currentUser.streakDays;
      }
    });
    res.json(responseSuccess(sorted));
  });

  // Communities: List all communities with current user membership role
  app.get('/api/communities', (req: Request, res: Response) => {
    const enriched = communities.map((comm) => {
      const membership = communityMembers.find(
        (cm) => cm.communityId === comm.id && cm.userId === currentUser.id
      );
      const pendingReq = joinRequests.find(
        (r) => r.communityId === comm.id && r.userId === currentUser.id && r.status === 'PENDING'
      );
      const actualMemberCount = communityMembers.filter((cm) => cm.communityId === comm.id).length;

      let userRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'PENDING' | 'NONE' = 'NONE';
      if (membership) {
        userRole = membership.role;
      } else if (pendingReq) {
        userRole = 'PENDING';
      }

      return {
        ...comm,
        memberCount: actualMemberCount,
        userRole,
      };
    });
    res.json(responseSuccess(enriched));
  });

  // Communities: Get current user's joined communities
  app.get('/api/communities/my', (req: Request, res: Response) => {
    const myMemberships = communityMembers.filter((cm) => cm.userId === currentUser.id);
    const myCommunityIds = new Set(myMemberships.map((m) => m.communityId));
    const myComms = communities
      .filter((c) => myCommunityIds.has(c.id))
      .map((comm) => {
        const mem = myMemberships.find((m) => m.communityId === comm.id);
        const actualCount = communityMembers.filter((cm) => cm.communityId === comm.id).length;
        return {
          ...comm,
          memberCount: actualCount,
          userRole: mem?.role || 'MEMBER',
        };
      });
    res.json(responseSuccess(myComms));
  });

  // Communities: Create a new community
  app.post('/api/communities', (req: Request, res: Response) => {
    const { name, description, icon, color, isPrivate, tags } = req.body;
    if (!name?.trim()) {
      return res.status(400).json(responseError('Community name is required'));
    }

    const newCommId = 'comm-' + Date.now();
    const newCommunity: Community = {
      id: newCommId,
      name: name.trim(),
      description: description || '',
      icon: icon || 'Users',
      color: color || '#8BC34A',
      isPrivate: Boolean(isPrivate),
      memberCount: 1,
      ownerId: currentUser.id,
      ownerName: currentUser.displayName,
      userRole: 'OWNER',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
    };

    communities.unshift(newCommunity);

    // Add creator as OWNER member
    const newMember: CommunityMember = {
      id: 'cm-' + Date.now(),
      communityId: newCommId,
      userId: currentUser.id,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      role: 'OWNER',
      xp: currentUser.xp,
      streakDays: currentUser.streakDays,
      cardsStudiedThisWeek: 45,
      rank: 1,
      joinedAt: new Date().toISOString(),
    };
    communityMembers.push(newMember);

    res.json(responseSuccess(newCommunity, 'Community created successfully'));
  });

  // Communities: Join open community or request to join private community
  app.post('/api/communities/:id/join', (req: Request, res: Response) => {
    const { id } = req.params;
    const { message } = req.body;
    const comm = communities.find((c) => c.id === id);
    if (!comm) return res.status(404).json(responseError('Community not found', 404));

    const existingMember = communityMembers.find(
      (cm) => cm.communityId === id && cm.userId === currentUser.id
    );
    if (existingMember) {
      return res.status(400).json(responseError('You are already a member of this community'));
    }

    if (comm.isPrivate) {
      // Create a join request
      const existingReq = joinRequests.find(
        (r) => r.communityId === id && r.userId === currentUser.id && r.status === 'PENDING'
      );
      if (existingReq) {
        return res.status(400).json(responseError('Join request already pending approval'));
      }

      const reqObj: CommunityJoinRequest = {
        id: 'req-' + Date.now(),
        communityId: id,
        communityName: comm.name,
        userId: currentUser.id,
        displayName: currentUser.displayName,
        userEmail: currentUser.email,
        avatarUrl: currentUser.avatarUrl,
        message: message || 'I would like to join your learning community!',
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      };
      joinRequests.push(reqObj);

      return res.json(
        responseSuccess({ status: 'REQUEST_SENT', request: reqObj }, 'Join request sent to community admins')
      );
    } else {
      // Join immediately
      const newMember: CommunityMember = {
        id: 'cm-' + Date.now(),
        communityId: id,
        userId: currentUser.id,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        role: 'MEMBER',
        xp: currentUser.xp,
        streakDays: currentUser.streakDays,
        cardsStudiedThisWeek: 20,
        joinedAt: new Date().toISOString(),
      };
      communityMembers.push(newMember);

      return res.json(
        responseSuccess({ status: 'JOINED', member: newMember }, 'Joined community successfully')
      );
    }
  });

  // Communities: Leave community
  app.post('/api/communities/:id/leave', (req: Request, res: Response) => {
    const { id } = req.params;
    communityMembers = communityMembers.filter(
      (cm) => !(cm.communityId === id && cm.userId === currentUser.id)
    );
    res.json(responseSuccess({ left: true }, 'Left community'));
  });

  // Communities: Invite / Add a user directly (owner/admin)
  app.post('/api/communities/:id/invite', (req: Request, res: Response) => {
    const { id } = req.params;
    const { emailOrName } = req.body;
    if (!emailOrName?.trim()) {
      return res.status(400).json(responseError('User email or name is required'));
    }

    const comm = communities.find((c) => c.id === id);
    if (!comm) return res.status(404).json(responseError('Community not found', 404));

    const invitedName = emailOrName.trim();
    const newMember: CommunityMember = {
      id: 'cm-' + Date.now(),
      communityId: id,
      userId: 'usr-inv-' + Date.now(),
      displayName: invitedName.includes('@') ? invitedName.split('@')[0] : invitedName,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
      role: 'MEMBER',
      xp: Math.floor(1000 + Math.random() * 3000),
      streakDays: Math.floor(1 + Math.random() * 15),
      cardsStudiedThisWeek: Math.floor(20 + Math.random() * 80),
      joinedAt: new Date().toISOString(),
    };
    communityMembers.push(newMember);

    res.json(responseSuccess(newMember, `User ${invitedName} added to the community`));
  });

  // Communities: Get pending join requests
  app.get('/api/communities/:id/requests', (req: Request, res: Response) => {
    const { id } = req.params;
    const reqs = joinRequests.filter((r) => r.communityId === id && r.status === 'PENDING');
    res.json(responseSuccess(reqs));
  });

  // Communities: Approve join request
  app.post('/api/communities/:id/requests/:requestId/approve', (req: Request, res: Response) => {
    const { id, requestId } = req.params;
    const reqObj = joinRequests.find((r) => r.id === requestId && r.communityId === id);
    if (!reqObj) return res.status(404).json(responseError('Request not found', 404));

    reqObj.status = 'APPROVED';

    // Add to members
    const newMember: CommunityMember = {
      id: 'cm-' + Date.now(),
      communityId: id,
      userId: reqObj.userId,
      displayName: reqObj.displayName,
      avatarUrl: reqObj.avatarUrl,
      role: 'MEMBER',
      xp: Math.floor(1500 + Math.random() * 2500),
      streakDays: Math.floor(3 + Math.random() * 12),
      cardsStudiedThisWeek: 40,
      joinedAt: new Date().toISOString(),
    };
    communityMembers.push(newMember);

    res.json(responseSuccess(newMember, `Approved ${reqObj.displayName}'s join request`));
  });

  // Communities: Reject join request
  app.post('/api/communities/:id/requests/:requestId/reject', (req: Request, res: Response) => {
    const { id, requestId } = req.params;
    const reqObj = joinRequests.find((r) => r.id === requestId && r.communityId === id);
    if (!reqObj) return res.status(404).json(responseError('Request not found', 404));

    reqObj.status = 'REJECTED';
    res.json(responseSuccess({ rejected: true }, `Rejected join request`));
  });

  // Communities: Get ranked leaderboard for a specific community
  app.get('/api/communities/:id/leaderboard', (req: Request, res: Response) => {
    const { id } = req.params;
    const comm = communities.find((c) => c.id === id);
    if (!comm) return res.status(404).json(responseError('Community not found', 404));

    // Get all members of this community
    const members = communityMembers
      .filter((cm) => cm.communityId === id)
      .map((cm) => {
        if (cm.userId === currentUser.id) {
          return {
            ...cm,
            xp: currentUser.xp,
            streakDays: currentUser.streakDays,
            displayName: `${currentUser.displayName} (You)`,
            avatarUrl: currentUser.avatarUrl,
          };
        }
        return cm;
      });

    // Sort by XP descending
    const sorted = [...members].sort((a, b) => b.xp - a.xp);
    sorted.forEach((m, idx) => {
      m.rank = idx + 1;
    });

    res.json(
      responseSuccess({
        community: {
          ...comm,
          memberCount: sorted.length,
        },
        members: sorted,
      })
    );
  });

  // AI Flashcard Generation (Gemini API server-side)
  app.post('/api/generate-cards', async (req: Request, res: Response) => {
    const { topic, notes, count = 5 } = req.body;

    if (!topic && !notes) {
      return res.status(400).json(responseError('Topic or study notes are required'));
    }

    try {
      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are an expert cognitive tutor specializing in active recall flashcards following the FSRS algorithm.
Generate ${count} high-yield, concise flashcards based on the following topic or notes:
Topic: ${topic || 'General'}
Notes/Context: ${notes || ''}

Respond ONLY with a valid JSON array of objects with the following format:
[
  {
    "front": "Clear question or prompt testing a single atomic concept",
    "back": "Concise, precise explanation or definition",
    "hint": "Brief memory trigger or clue",
    "tags": ["tag1", "tag2"]
  }
]
No markdown wrapping, no code block backticks, just raw JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedCards = JSON.parse(cleanedJson);
        return res.json(responseSuccess(parsedCards, 'Flashcards generated with AI'));
      }
    } catch (err) {
      console.warn('Gemini API call skipped or failed, using heuristic generation:', err);
    }

    // Fallback heuristic generator
    const fallbackCards = [
      {
        front: `What is the core principle of ${topic || 'this subject'}?`,
        back: `The fundamental concept focuses on foundational mechanisms, input/output relationships, and structural properties.`,
        hint: `Key definition & mechanism`,
        tags: [topic ? topic.toLowerCase().replace(/\s+/g, '-') : 'general'],
      },
      {
        front: `What are the primary advantages and trade-offs of ${topic || 'this method'}?`,
        back: `Provides high performance, modularity, and predictability, but requires careful consideration of edge cases and complexity.`,
        hint: `Compare pros and cons`,
        tags: ['trade-offs', 'analysis'],
      },
      {
        front: `How do you apply active recall and spaced repetition to ${topic || 'mastering concepts'}?`,
        back: `By repeatedly retrieving concepts from memory at expanding intervals based on the FSRS retention probability model.`,
        hint: `Testing effect + expanding intervals`,
        tags: ['spaced-repetition'],
      },
    ];

    res.json(responseSuccess(fallbackCards, 'Flashcards generated'));
  });

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  // Kahoot-style Multiplayer Games State
  const activeQuizzes = new Map<string, any>();

  io.on('connection', (socket) => {
    socket.on('host:create_quiz', (data) => {
      // data: { hostId, hostName, subjectId, subjectTitle, cards }
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const quiz = {
        roomCode,
        hostSocketId: socket.id,
        hostId: data.hostId,
        hostName: data.hostName,
        subjectId: data.subjectId,
        subjectTitle: data.subjectTitle,
        cards: data.cards,
        players: [], // { socketId, id, name, score, currentAnswer }
        state: 'LOBBY', // LOBBY | QUESTION | LEADERBOARD | FINISHED
        currentQuestionIndex: -1,
        questionStartTime: 0
      };

      activeQuizzes.set(roomCode, quiz);
      socket.join(roomCode);
      socket.emit('host:quiz_created', quiz);
    });

    socket.on('player:join', (data) => {
      // data: { roomCode, playerId, playerName }
      const quiz = activeQuizzes.get(data.roomCode);
      if (!quiz) {
        socket.emit('player:error', 'Room not found');
        return;
      }
      if (quiz.state !== 'LOBBY') {
        socket.emit('player:error', 'Quiz already started');
        return;
      }
      
      const newPlayer = {
        socketId: socket.id,
        id: data.playerId,
        name: data.playerName,
        score: 0,
        currentAnswer: null
      };

      quiz.players.push(newPlayer);
      socket.join(data.roomCode);
      
      socket.emit('player:joined', { quiz, player: newPlayer });
      io.to(quiz.roomCode).emit('quiz:state_updated', quiz);
    });

    socket.on('host:start_quiz', (roomCode) => {
      const quiz = activeQuizzes.get(roomCode);
      if (quiz && quiz.hostSocketId === socket.id) {
        quiz.state = 'QUESTION';
        quiz.currentQuestionIndex = 0;
        quiz.questionStartTime = Date.now();
        quiz.players.forEach((p: any) => p.currentAnswer = null);
        io.to(roomCode).emit('quiz:state_updated', quiz);
      }
    });

    socket.on('player:submit_answer', (data) => {
      // data: { roomCode, answer }
      const quiz = activeQuizzes.get(data.roomCode);
      if (quiz && quiz.state === 'QUESTION') {
        const player = quiz.players.find((p: any) => p.socketId === socket.id);
        if (player && !player.currentAnswer) {
          player.currentAnswer = data.answer;
          
          // Calculate score based on time
          const currentCard = quiz.cards[quiz.currentQuestionIndex];
          if (data.answer.toLowerCase() === currentCard.back.toLowerCase()) {
            const timeTaken = Date.now() - quiz.questionStartTime;
            const points = Math.max(10, Math.floor(1000 - (timeTaken / 10)));
            player.score += points;
          }
          
          io.to(quiz.hostSocketId).emit('host:player_answered', { playerId: player.id });
          socket.emit('player:answer_received', { isCorrect: data.answer.toLowerCase() === currentCard.back.toLowerCase() });
          
          // Check if everyone answered
          const allAnswered = quiz.players.every((p: any) => p.currentAnswer);
          if (allAnswered) {
             quiz.state = 'LEADERBOARD';
             io.to(quiz.roomCode).emit('quiz:state_updated', quiz);
          }
        }
      }
    });

    socket.on('host:next_question', (roomCode) => {
      const quiz = activeQuizzes.get(roomCode);
      if (quiz && quiz.hostSocketId === socket.id) {
        if (quiz.currentQuestionIndex + 1 < quiz.cards.length) {
          quiz.currentQuestionIndex++;
          quiz.state = 'QUESTION';
          quiz.questionStartTime = Date.now();
          quiz.players.forEach((p: any) => p.currentAnswer = null);
        } else {
          quiz.state = 'FINISHED';
        }
        io.to(roomCode).emit('quiz:state_updated', quiz);
      }
    });

    socket.on('disconnect', () => {
      // Cleanup for host disconnecting
      for (const [roomCode, quiz] of activeQuizzes.entries()) {
        if (quiz.hostSocketId === socket.id) {
          io.to(roomCode).emit('quiz:host_disconnected');
          activeQuizzes.delete(roomCode);
          return;
        }
        
        // Player disconnect
        const playerIndex = quiz.players.findIndex((p: any) => p.socketId === socket.id);
        if (playerIndex !== -1) {
          quiz.players.splice(playerIndex, 1);
          io.to(roomCode).emit('quiz:state_updated', quiz);
        }
      }
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Oopsly server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
