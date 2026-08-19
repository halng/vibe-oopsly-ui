import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Flame,
  Zap,
  Users,
  Plus,
  Lock,
  Globe,
  UserPlus,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Search,
  LogOut,
  ChevronDown,
  Layers,
  BookOpen,
} from 'lucide-react';
import { Community, CommunityMember, UserProfile } from '../types';
import { ApiService } from '../services/api';
import { CommunityModal } from './CommunityModal';
import { InviteUserModal } from './InviteUserModal';
import { CommunityRequestsModal } from './CommunityRequestsModal';

interface LeaderboardViewProps {
  currentUser?: UserProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser }) => {
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [communityLeaderboard, setCommunityLeaderboard] = useState<{
    community: Community | null;
    members: CommunityMember[];
  }>({ community: null, members: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'xp' | 'streak' | 'weekly'>('xp');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  // Load communities on mount
  useEffect(() => {
    loadCommunities();
  }, []);

  // When selected community changes, load its leaderboard
  useEffect(() => {
    if (selectedCommunityId) {
      loadCommunityLeaderboard(selectedCommunityId);
    }
  }, [selectedCommunityId]);

  const loadCommunities = async () => {
    setIsLoading(true);
    const [allRes, myRes] = await Promise.all([
      ApiService.getCommunities(),
      ApiService.getMyCommunities(),
    ]);

    if (allRes.isSuccess && allRes.data) {
      setAllCommunities(allRes.data);
    }
    if (myRes.isSuccess && myRes.data) {
      setMyCommunities(myRes.data);
      if (myRes.data.length > 0 && !selectedCommunityId) {
        setSelectedCommunityId(myRes.data[0].id);
      }
    }
    setIsLoading(false);
  };

  const loadCommunityLeaderboard = async (commId: string) => {
    setIsLeaderboardLoading(true);
    const res = await ApiService.getCommunityLeaderboard(commId);
    if (res.isSuccess && res.data) {
      setCommunityLeaderboard({
        community: res.data.community,
        members: res.data.members,
      });
    }
    setIsLeaderboardLoading(false);
  };

  const handleCreateCommunity = async (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
    isPrivate: boolean;
    tags: string[];
  }) => {
    const res = await ApiService.createCommunity(data);
    if (res.isSuccess && res.data) {
      await loadCommunities();
      setSelectedCommunityId(res.data.id);
    }
  };

  const handleJoinCommunity = async (comm: Community) => {
    const res = await ApiService.joinCommunity(comm.id);
    if (res.isSuccess) {
      await loadCommunities();
      if (res.data?.status === 'JOINED') {
        setSelectedCommunityId(comm.id);
      }
    }
  };

  const handleLeaveCommunity = async (commId: string) => {
    if (window.confirm('Are you sure you want to leave this learning community?')) {
      const res = await ApiService.leaveCommunity(commId);
      if (res.isSuccess) {
        await loadCommunities();
        setSelectedCommunityId(null);
      }
    }
  };

  const handleInviteUser = async (emailOrName: string) => {
    if (!selectedCommunityId) return;
    const res = await ApiService.inviteUserToCommunity(selectedCommunityId, emailOrName);
    if (res.isSuccess) {
      await loadCommunityLeaderboard(selectedCommunityId);
    }
  };

  // Active community details
  const activeCommunity = useMemo(() => {
    if (!selectedCommunityId) return null;
    return (
      myCommunities.find((c) => c.id === selectedCommunityId) ||
      allCommunities.find((c) => c.id === selectedCommunityId) ||
      null
    );
  }, [selectedCommunityId, myCommunities, allCommunities]);

  // Is user owner or admin of active community?
  const isOwnerOrAdmin = useMemo(() => {
    if (!activeCommunity) return false;
    return activeCommunity.userRole === 'OWNER' || activeCommunity.userRole === 'ADMIN';
  }, [activeCommunity]);

  // Sorted members
  const sortedMembers = useMemo(() => {
    const list = [...communityLeaderboard.members];
    if (sortBy === 'xp') {
      list.sort((a, b) => b.xp - a.xp);
    } else if (sortBy === 'streak') {
      list.sort((a, b) => b.streakDays - a.streakDays);
    } else if (sortBy === 'weekly') {
      list.sort((a, b) => b.cardsStudiedThisWeek - a.cardsStudiedThisWeek);
    }
    return list.map((m, idx) => ({ ...m, rank: idx + 1 }));
  }, [communityLeaderboard.members, sortBy]);

  const top1 = sortedMembers[0];
  const top2 = sortedMembers[1];
  const top3 = sortedMembers[2];

  // =========================================================================
  // STATE 1: USER BELONGS TO ZERO COMMUNITIES (GATED ACCESS & DISCOVERY)
  // =========================================================================
  if (!isLoading && myCommunities.length === 0) {
    return (
      <div id="no-community-leaderboard-gate" className="space-y-6 animate-fade-in">
        {/* Banner Gate Notice */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-950 text-white rounded-3xl p-7 sm:p-9 shadow-sm border border-stone-800 relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8BC34A]/20 text-[#8BC34A] text-xs font-extrabold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Community-Driven Leaderboards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Join a Learning Community to Unlock Leaderboards
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              In Oopsly, leaderboards are hosted within collaborative study communities. Connect with peers, track your weekly active recall progress, and compete on XP and streaks!
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                id="btn-create-first-community"
                data-testid="btn-create-first-community"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your Own Community</span>
              </button>
            </div>
          </div>
        </div>

        {/* Browse Public Communities to Join */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Explore Active Study Communities
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Join an open community to start ranking on their leaderboard immediately.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8BC34A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allCommunities
              .filter(
                (c) =>
                  c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  c.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  (c.tags || []).some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()))
              )
              .map((comm) => (
                <div
                  key={comm.id}
                  id={`community-card-${comm.id}`}
                  className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-2xs text-sm"
                          style={{ backgroundColor: comm.color || '#8BC34A' }}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#558B2F] dark:group-hover:text-[#8BC34A] transition-colors">
                            {comm.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                            <span>{comm.memberCount} members</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {comm.isPrivate ? (
                                <>
                                  <Lock className="w-3 h-3 text-amber-500" />
                                  Private
                                </>
                              ) : (
                                <>
                                  <Globe className="w-3 h-3 text-emerald-500" />
                                  Open
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {comm.description || 'Collaborative flashcard and active recall community.'}
                    </p>

                    {comm.tags && comm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {comm.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-semibold"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      Created by {comm.ownerName}
                    </span>

                    {comm.userRole === 'PENDING' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200">
                        Request Pending
                      </span>
                    ) : (
                      <button
                        id={`btn-join-comm-${comm.id}`}
                        data-testid={`btn-join-${comm.id}`}
                        onClick={() => handleJoinCommunity(comm)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8BC34A] hover:bg-[#7CB342] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>{comm.isPrivate ? 'Request to Join' : 'Join Community'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Create Community Modal */}
        <CommunityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCommunity}
        />
      </div>
    );
  }

  // =========================================================================
  // STATE 2: USER BELONGS TO COMMUNITY -> ACTIVE LEADERBOARD
  // =========================================================================
  return (
    <div id="community-leaderboard-page" className="space-y-6 animate-fade-in">
      {/* Community Selector & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Community Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            My Communities:
          </span>
          {myCommunities.map((comm) => (
            <button
              key={comm.id}
              id={`tab-community-${comm.id}`}
              data-testid={`tab-comm-${comm.id}`}
              onClick={() => setSelectedCommunityId(comm.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                selectedCommunityId === comm.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: comm.color || '#8BC34A' }}
              />
              <span>{comm.name}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions (Create Community, Invite, Requests) */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            id="btn-create-another-community"
            data-testid="btn-create-community"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Community</span>
          </button>

          {isOwnerOrAdmin && activeCommunity && (
            <>
              <button
                id="btn-open-invite-user"
                data-testid="btn-invite-user"
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8BC34A]/15 text-[#558B2F] dark:text-[#8BC34A] hover:bg-[#8BC34A]/25 text-xs font-bold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>

              <button
                id="btn-open-community-requests"
                data-testid="btn-community-requests"
                onClick={() => setIsRequestsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer border border-amber-200 dark:border-amber-800"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Join Requests</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Community Banner & Stats */}
      {activeCommunity && (
        <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-950 text-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-2 relative z-10 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeCommunity.color || '#8BC34A' }}
              />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#8BC34A]">
                {activeCommunity.name} Leaderboard
              </span>
              <span className="text-stone-500">•</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-stone-200 text-[10px] font-bold">
                {activeCommunity.userRole}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeCommunity.name}
            </h1>
            <p className="text-xs text-stone-300 leading-relaxed">
              {activeCommunity.description ||
                'Compete with fellow members by earning XP through daily active recall reviews.'}
            </p>
          </div>

          {/* Quick Metrics & Leave Button */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xs text-center min-w-[80px]">
              <div className="text-lg font-extrabold text-white">
                {communityLeaderboard.members.length}
              </div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Members</div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xs text-center min-w-[80px]">
              <div className="text-lg font-extrabold text-[#8BC34A]">
                {communityLeaderboard.members.reduce((acc, m) => acc + (m.xp || 0), 0).toLocaleString()}
              </div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Total XP</div>
            </div>

            <button
              onClick={() => handleLeaveCommunity(activeCommunity.id)}
              title="Leave Community"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition-colors cursor-pointer border border-white/10"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top 3 Podium (If at least 2 members) */}
      {sortedMembers.length >= 2 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-5 items-end pt-4 pb-2">
          {/* 2nd Place */}
          {top2 && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-800 text-center flex flex-col items-center justify-between gap-3 shadow-xs">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-stone-300 shadow-sm mx-auto">
                  <img
                    src={top2.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                    alt={top2.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-stone-300 text-stone-800 font-extrabold text-xs flex items-center justify-center shadow-xs">
                  2
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                  {top2.displayName}
                </h4>
                <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-stone-600 dark:text-stone-400 mt-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  <span>{top2.xp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place (Gold Crown) */}
          {top1 && (
            <div className="bg-gradient-to-b from-amber-500/10 to-white dark:to-stone-900 rounded-3xl p-4 sm:p-6 border-2 border-amber-400/60 text-center flex flex-col items-center justify-between gap-3 shadow-md relative -translate-y-2">
              <div className="relative">
                <Crown className="w-6 h-6 text-amber-500 fill-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-amber-400 shadow-md mx-auto">
                  <img
                    src={top1.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'}
                    alt={top1.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-sm">
                  1
                </div>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100 line-clamp-1">
                  {top1.displayName}
                </h4>
                <div className="flex items-center justify-center gap-1 text-xs font-black text-amber-700 dark:text-amber-400 mt-1">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{top1.xp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-800 text-center flex flex-col items-center justify-between gap-3 shadow-xs">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-amber-700/50 shadow-sm mx-auto">
                  <img
                    src={top3.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={top3.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700/60 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  3
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                  {top3.displayName}
                </h4>
                <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-stone-600 dark:text-stone-400 mt-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  <span>{top3.xp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
        {/* Table Header & Sort Filter */}
        <div className="p-4 sm:px-6 bg-stone-50/80 dark:bg-stone-800/60 border-b border-stone-200/70 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-6 text-xs font-bold text-stone-400 uppercase tracking-wider">
            <span>Rank & Member</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-semibold mr-1">Sort by:</span>
            <button
              onClick={() => setSortBy('xp')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'xp'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              XP
            </button>
            <button
              onClick={() => setSortBy('streak')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'streak'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              Streak
            </button>
            <button
              onClick={() => setSortBy('weekly')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'weekly'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              Cards / Week
            </button>
          </div>
        </div>

        {isLeaderboardLoading ? (
          <div className="py-16 text-center text-xs text-stone-400">Loading leaderboard...</div>
        ) : sortedMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">No members found</div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {sortedMembers.map((m) => {
              const isCurrentUser = m.userId === 'usr-1' || m.displayName.includes('(You)');
              const isTop1 = m.rank === 1;
              const isTop2 = m.rank === 2;
              const isTop3 = m.rank === 3;

              return (
                <div
                  key={m.id}
                  id={`member-row-${m.id}`}
                  data-testid={`member-row-${m.id}`}
                  className={`px-6 py-4 flex items-center justify-between transition-colors ${
                    isCurrentUser
                      ? 'bg-[#8BC34A]/10 dark:bg-[#8BC34A]/15 font-bold'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  {/* Left: Rank & User Info */}
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="w-8 flex items-center justify-center">
                      {isTop1 ? (
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
                          <Crown className="w-4 h-4 fill-amber-950" />
                        </div>
                      ) : isTop2 ? (
                        <div className="w-7 h-7 rounded-full bg-stone-300 text-stone-900 flex items-center justify-center font-black text-xs">
                          2
                        </div>
                      ) : isTop3 ? (
                        <div className="w-7 h-7 rounded-full bg-amber-700/60 text-white flex items-center justify-center font-black text-xs">
                          3
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-stone-400">{m.rank}</span>
                      )}
                    </div>

                    {/* Avatar & Display Name */}
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          m.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={m.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700 shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {m.displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[#8BC34A] text-white">
                              You
                            </span>
                          )}
                          {m.role === 'OWNER' && (
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              Owner
                            </span>
                          )}
                          {m.role === 'ADMIN' && (
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                          {m.cardsStudiedThisWeek} cards this week
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Streak & XP */}
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{m.streakDays}d</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-900 dark:text-stone-100 min-w-[70px] justify-end">
                      <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                      <span>{m.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCommunity}
      />

      {activeCommunity && (
        <>
          <InviteUserModal
            isOpen={isInviteModalOpen}
            communityName={activeCommunity.name}
            onClose={() => setIsInviteModalOpen(false)}
            onInvite={handleInviteUser}
          />

          <CommunityRequestsModal
            isOpen={isRequestsModalOpen}
            communityId={activeCommunity.id}
            communityName={activeCommunity.name}
            onClose={() => setIsRequestsModalOpen(false)}
            onApproveSuccess={() => loadCommunityLeaderboard(activeCommunity.id)}
          />
        </>
      )}
    </div>
  );
};
