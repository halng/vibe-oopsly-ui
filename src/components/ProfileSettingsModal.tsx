import React, { useState } from 'react';
import {
  X,
  User,
  Sliders,
  Bell,
  Volume2,
  Moon,
  Sparkles,
  Shield,
  Save,
  LogOut,
} from 'lucide-react';
import { UserProfile, UserSettings } from '../types';
import { ApiService } from '../services/api';

interface ProfileSettingsModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  user,
  onClose,
  onUpdateUser,
  onLogout,
}) => {
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
    <div
      id="profile-settings-modal"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8BC34A]/20 text-[#558B2F] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Profile & FSRS Preferences</h2>
              <p className="text-xs text-stone-500">Configure learning algorithm & account settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="py-5 space-y-5 text-xs">
          {/* User Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Account Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Bio / Study Goals</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Preparing for Distributed Systems & Medical Finals"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:ring-2 focus:ring-[#8BC34A] focus:outline-none"
              />
            </div>
          </div>

          {/* FSRS Algorithm Settings */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#8BC34A]" />
              <span>FSRS Spaced Repetition Parameters</span>
            </h3>

            {/* Retention Slider */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span>Target Memory Retention Rate</span>
                <span className="text-[#558B2F] font-black text-sm">
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
              <div className="flex justify-between text-[10px] text-stone-400 font-medium">
                <span>75% (Fewer Reviews)</span>
                <span>90% (Recommended)</span>
                <span>97% (Max Retention)</span>
              </div>
            </div>

            {/* Daily Card Goal */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div>
                <span className="font-bold text-stone-800 block">Daily Card Review Goal</span>
                <span className="text-[11px] text-stone-500">
                  Target number of cards to review daily
                </span>
              </div>
              <input
                type="number"
                min="5"
                max="100"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 20)}
                className="w-16 p-1.5 bg-white border border-stone-200 rounded-xl text-center font-bold text-stone-900"
              />
            </div>
          </div>

          {/* Preferences Switches */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Experience
            </h3>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-stone-500" />
                <span className="font-bold text-stone-800">Audio Synthesis & Sounds</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEffects(!soundEffects)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 cursor-pointer ${
                  soundEffects ? 'bg-[#8BC34A] justify-end' : 'bg-stone-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-stone-500" />
                <span className="font-bold text-stone-800">Daily Study Reminders</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowReminders(!allowReminders)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 cursor-pointer ${
                  allowReminders ? 'bg-[#8BC34A] justify-end' : 'bg-stone-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </button>
            </div>
            
            {allowReminders && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Forecasted Notifications</h4>
                    <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
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
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#8BC34A] hover:bg-[#7CB342] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savedSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
