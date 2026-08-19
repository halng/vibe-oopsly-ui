import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, CheckCircle2, Bell, BellOff } from 'lucide-react';
import { Subject, SubjectSchedule } from '../types';
import { ApiService } from '../services/api';

interface SubjectScheduleModalProps {
  subject: Subject;
  onClose: () => void;
  onUpdate: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' }
];

export const SubjectScheduleModal: React.FC<SubjectScheduleModalProps> = ({
  subject,
  onClose,
  onUpdate
}) => {
  const [schedule, setSchedule] = useState<SubjectSchedule>(
    subject.schedule || {
      days: [],
      time: '18:00',
      enabled: false
    }
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const toggleDay = (day: number) => {
    setSchedule(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort();
      return { ...prev, days };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await ApiService.updateSubject(subject.id, {
      ...subject,
      schedule
    });
    
    if (res.isSuccess) {
      setIsSaved(true);
      onUpdate();
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1500);
    } else {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Study Schedule</h2>
              <p className="text-xs font-medium text-stone-500 truncate max-w-[200px]">{subject.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${schedule.enabled ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'}`}>
                {schedule.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Enable Reminders</p>
                <p className="text-xs text-stone-500">Get notified when it's time to learn</p>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
              onClick={() => setSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedule.enabled ? 'bg-indigo-600' : 'bg-stone-300 dark:bg-stone-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className={schedule.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none transition-opacity'}>
            {/* Days Selector */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-stone-700 dark:text-stone-300">Repeat on days</label>
              <div className="flex justify-between gap-1">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      schedule.days.includes(day.value)
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                    }`}
                    title={day.fullLabel}
                  >
                    {day.label[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selector */}
            <div className="space-y-3 mt-6">
              <label className="text-sm font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Notification Time
              </label>
              <input
                type="time"
                value={schedule.time}
                onChange={e => setSchedule(prev => ({ ...prev, time: e.target.value }))}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-stone-800 dark:text-stone-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                isSaved 
                  ? 'bg-emerald-500' 
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Schedule Saved
                </>
              ) : (
                <>
                  <CalendarIcon className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Schedule'}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
