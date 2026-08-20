import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Sliders,
  Bell,
  Volume2,
  Moon,
  Save,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ApiService } from '../services/api';

interface ProfileSettingsPageProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onOpenThemeModal: () => void;
  onLogout: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsPageProps> = ({
  user,
  onUpdateUser,
  onOpenThemeModal,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio || '');
  const [targetRetention, setTargetRetention] = useState(
    user.settings?.targetRetentionRate || 0.9
  );
  const [dailyGoal, setDailyGoal] = useState(user.settings?.dailyGoal || 20);
  const [soundEffects, setSoundEffects] = useState(
    user.settings?.soundEffectsEnabled ?? true
  );
  const [hapticFeedback, setHapticFeedback] = useState(
    user.settings?.hapticFeedbackEnabled ?? true
  );
  const [allowReminders, setAllowReminders] = useState(
    user.settings?.allowReminders ?? false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser: UserProfile = {
        ...user,
        displayName,
        email,
        bio,
        settings: {
          ...user.settings,
          targetRetentionRate: targetRetention,
          dailyGoal,
          soundEffectsEnabled: soundEffects,
          hapticFeedbackEnabled: hapticFeedback,
          allowReminders,
        },
      };

      const res = await ApiService.updateProfile(updatedUser);
      if (res.isSuccess) {
        onUpdateUser(updatedUser);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="profile-settings-page" className="max-w-2xl mx-auto w-full pb-12 animate-fade-in">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl w-full p-6 sm:p-8 shadow-xs border border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8BC34A]/20 text-[#558B2F] dark:text-[#8BC34A] flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">Profile & FSRS Preferences</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">Configure learning algorithm & account settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="py-6 space-y-8 text-sm">
          {/* User Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Account Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none transition-shadow"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">Bio / Study Goals</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Preparing for Distributed Systems & Medical Finals"
                className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none transition-shadow"
              />
            </div>
          </div>

          {/* FSRS Algorithm Settings */}
          <div className="space-y-4 pt-6 border-t border-stone-100 dark:border-stone-800">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#8BC34A]" />
              <span>FSRS Spaced Repetition Parameters</span>
            </h3>

            {/* Retention Slider */}
            <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-3">
              <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                <span>Target Memory Retention Rate</span>
                <span className="text-[#558B2F] dark:text-[#8BC34A] font-black text-base">
                  {Math.round(targetRetention * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.75"
                max="0.97"
                step="0.01"
                value={targetRetention}
                onChange={(e) => setTargetRetention(parseFloat(e.target.value))}
                className="w-full accent-[#8BC34A] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 font-medium">
                <span>75% (Fewer Reviews)</span>
                <span>90% (Recommended)</span>
                <span>97% (Max Retention)</span>
              </div>
            </div>

            {/* Daily Card Goal */}
            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/80 dark:border-stone-700/80">
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block text-base">Daily Card Review Goal</span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Target number of cards to review daily
                </span>
              </div>
              <input
                type="number"
                min="5"
                max="100"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 20)}
                className="w-20 p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-center font-bold text-stone-900 dark:text-stone-100 text-base"
              />
            </div>
          </div>

          {/* Preferences Switches */}
          <div className="space-y-4 pt-6 border-t border-stone-100 dark:border-stone-800">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Experience
            </h3>

            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/80 dark:border-stone-700/80">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-stone-500" />
                <span className="font-bold text-stone-800 dark:text-stone-200">Visual Theme</span>
              </div>
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                Change Theme
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/80 dark:border-stone-700/80">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-stone-500" />
                <span className="font-bold text-stone-800 dark:text-stone-200">Audio Synthesis & Sounds</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEffects(!soundEffects)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 cursor-pointer ${
                  soundEffects ? 'bg-[#8BC34A] justify-end' : 'bg-stone-300 dark:bg-stone-600 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/80 dark:border-stone-700/80">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-stone-500" />
                <span className="font-bold text-stone-800 dark:text-stone-200">Daily Study Reminders</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowReminders(!allowReminders)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 cursor-pointer ${
                  allowReminders ? 'bg-[#8BC34A] justify-end' : 'bg-stone-300 dark:bg-stone-600 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>
            
            {allowReminders && (
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Forecasted Notifications</h4>
                    <p className="text-sm text-indigo-700/80 dark:text-indigo-400 mt-1 leading-relaxed">
                      Reminders are automatically scheduled based on your FSRS intervals. 
                      You have <span className="font-bold">{user.totalCardsStudied}</span> active cards. 
                      You will be notified when your daily load requires review.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save & Logout */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#8BC34A] hover:bg-[#7CB342] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <Save className="w-5 h-5" />
              <span className="text-base">{savedSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
