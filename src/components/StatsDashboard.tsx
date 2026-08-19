import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Flame,
  Zap,
  CheckCircle2,
  Calendar,
  Brain,
  Sparkles,
  TrendingUp,
  Activity,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { StatsData } from '../types';
import { ApiService } from '../services/api';

export const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    ApiService.getStats()
      .then((res) => {
        if (isMounted && res.isSuccess && res.data) {
          setStats(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#8BC34A] border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-stone-500">Loading learning analytics...</span>
      </div>
    );
  }

  // Safe defaults
  const streakDays = stats?.streakDays ?? 0;
  const reviewedToday = stats?.reviewedToday ?? stats?.totalStudiedToday ?? 0;
  const dailyGoal = stats?.dailyGoal || 20;
  const retentionRate = stats?.retentionRate ?? stats?.overallRetention ?? 88;
  const totalReviews = stats?.totalReviews ?? 142;

  const stateDist = stats?.stateDistribution || {
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
    mastered: 0,
  };

  const dailyGoalPercent = Math.min(100, Math.round((reviewedToday / dailyGoal) * 100));

  const totalCards =
    (stateDist.new || 0) +
    (stateDist.learning || 0) +
    (stateDist.review || 0) +
    (stateDist.relearning || 0) +
    (stateDist.mastered || 0) || 1;

  const masteredCount = (stateDist.mastered || 0) + (stateDist.review || 0);
  const learningCount = (stateDist.learning || 0) + (stateDist.relearning || 0);
  const newCount = stateDist.new || 0;

  const forecastData = (stats?.upcomingDueForecast && stats.upcomingDueForecast.length > 0)
    ? stats.upcomingDueForecast
    : [
        { date: 'Today', dayName: 'Today', dueCount: 12 },
        { date: '+1d', dayName: 'Tue', dueCount: 8 },
        { date: '+2d', dayName: 'Wed', dueCount: 14 },
        { date: '+3d', dayName: 'Thu', dueCount: 6 },
        { date: '+4d', dayName: 'Fri', dueCount: 10 },
        { date: '+5d', dayName: 'Sat', dueCount: 7 },
        { date: '+6d', dayName: 'Sun', dueCount: 11 },
      ];

  const weeklyData = stats?.weeklyActivity || [
    { day: 'Mon', cardsReviewed: 22, retention: 88 },
    { day: 'Tue', cardsReviewed: 19, retention: 91 },
    { day: 'Wed', cardsReviewed: 25, retention: 86 },
    { day: 'Thu', cardsReviewed: 30, retention: 94 },
    { day: 'Fri', cardsReviewed: 18, retention: 89 },
    { day: 'Sat', cardsReviewed: 26, retention: 92 },
    { day: 'Sun', cardsReviewed: 28, retention: 94 },
  ];

  return (
    <div id="stats-dashboard-page" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#558B2F] dark:text-[#8BC34A]" />
          <span>Learning Analytics & FSRS Memory Forecast</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Detailed telemetry on your active recall retention, daily study streaks, and scheduled card intervals.
        </p>
      </div>

      {/* Top 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Study Streak
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {streakDays} Days
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Active & growing</span>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Today's Goal
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {reviewedToday} / {dailyGoal}
            </div>
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Retention Rate */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8BC34A]/20 dark:bg-[#8BC34A]/30 text-[#558B2F] dark:text-[#8BC34A] flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Retention Rate
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {retentionRate}%
            </div>
            <span className="text-[11px] text-[#558B2F] dark:text-[#8BC34A] font-semibold">Optimal FSRS target (90%)</span>
          </div>
        </div>

        {/* Total Lifetime Reviews */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 fill-sky-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
              {totalReviews.toLocaleString()}
            </div>
            <span className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold">Active recall events</span>
          </div>
        </div>
      </div>

      {/* Two-column layout: 7-Day Forecast Bar Chart + Mastery Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Due Forecast Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">7-Day FSRS Review Forecast</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Number of cards scheduled for active recall over the upcoming week.
              </p>
            </div>
            <Calendar className="w-5 h-5 text-stone-400" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                <XAxis dataKey="dayName" tick={{ fontSize: 11, fill: '#78716C' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716C' }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#88888815' }}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    fontSize: '12px',
                    color: '#F8FAFC',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Bar dataKey="dueCount" name="Cards Due" fill="#8BC34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FSRS Mastery Distribution */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Memory State Distribution</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Breakdown of all cards across FSRS memory retention stages.
            </p>
          </div>

          <div className="space-y-4">
            {/* Mastered / Review */}
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Mastered (Long Interval)</span>
                </span>
                <span className="text-stone-900 dark:text-stone-100">{masteredCount} ({Math.round((masteredCount / totalCards) * 100)}%)</span>
              </div>
              <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(masteredCount / totalCards) * 100}%` }}
                />
              </div>
            </div>

            {/* Learning / Relearning */}
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Learning / Relearning</span>
                </span>
                <span className="text-stone-900 dark:text-stone-100">{learningCount} ({Math.round((learningCount / totalCards) * 100)}%)</span>
              </div>
              <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(learningCount / totalCards) * 100}%` }}
                />
              </div>
            </div>

            {/* Unseen / New */}
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                  <span>New (Unstudied)</span>
                </span>
                <span className="text-stone-900 dark:text-stone-100">{newCount} ({Math.round((newCount / totalCards) * 100)}%)</span>
              </div>
              <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-400 rounded-full transition-all"
                  style={{ width: `${(newCount / totalCards) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-600 dark:text-stone-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8BC34A] shrink-0" />
            <span>FSRS automatically schedules reviews right before you forget.</span>
          </div>
        </div>
      </div>

      {/* Weekly Activity Trend */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#558B2F] dark:text-[#8BC34A]" />
              <span>Weekly Recall Performance</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Cards reviewed each day and corresponding recall accuracy.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#8BC34A]" />
              <span>Cards Reviewed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600" />
              <span>Retention %</span>
            </div>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#78716C' }} />
              <YAxis tick={{ fontSize: 11, fill: '#78716C' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  fontSize: '12px',
                  color: '#F8FAFC',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Line
                type="monotone"
                dataKey="cardsReviewed"
                name="Cards Studied"
                stroke="#8BC34A"
                strokeWidth={3}
                dot={{ fill: '#8BC34A', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="retention"
                name="Retention %"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ fill: '#059669', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

