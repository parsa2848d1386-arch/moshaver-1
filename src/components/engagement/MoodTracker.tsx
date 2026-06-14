'use client';

import { MOODS } from '@/constants';

interface MoodTrackerProps {
  selectedMood: string;
  onMoodChange: (mood: string) => void;
  moodHistory?: { date: string; mood: string }[];
}

const MOOD_EMOJI_MAP: Record<string, string> = {};
for (const m of MOODS) {
  MOOD_EMOJI_MAP[m.value] = m.emoji;
}

function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI_MAP[mood] || MOODS.find((m) => m.value === mood)?.emoji || '😶';
}

export default function MoodTracker({
  selectedMood,
  onMoodChange,
  moodHistory = [],
}: MoodTrackerProps) {
  // Get last 7 days' moods
  const last7Days = moodHistory.slice(-7);

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">🎭</span>
        <div>
          <h3 className="text-base font-bold text-zinc-100">حال و هوای من</h3>
          <p className="text-xs text-zinc-500">الان چه حسی داری؟</p>
        </div>
      </div>

      {/* Current mood display */}
      {selectedMood && (
        <div className="text-center mb-5 p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-2xl border border-indigo-500/15 shadow-inner">
          <div className="text-5xl mb-2">
            {getMoodEmoji(selectedMood)}
          </div>
          <div className="text-sm font-bold text-indigo-400">
            {MOODS.find((m) => m.value === selectedMood)?.label || selectedMood}
          </div>
        </div>
      )}

      {/* Mood selection grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.value;
          return (
            <button
              key={mood.value}
              onClick={() => onMoodChange(mood.value)}
              className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border transition-all duration-300 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-md scale-105'
                  : 'border-white/5 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`text-3xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}>
                {mood.emoji}
              </span>
              <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Weekly mood history */}
      {last7Days.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-zinc-500 mb-3 px-1">
            📅 سابقه روحی هفته گذشته:
          </div>
          <div className="flex justify-around gap-2 bg-zinc-900/30 p-3.5 rounded-2xl border border-white/5">
            {last7Days.map((entry, idx) => {
              const dayName = new Intl.DateTimeFormat('fa-IR', {
                weekday: 'narrow',
              }).format(new Date(entry.date));
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-xl hover:scale-110 transition-transform">{getMoodEmoji(entry.mood)}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">{dayName}</span>
                </div>
              );
            })}
            {/* Fill remaining days with empty slots */}
            {Array.from({ length: Math.max(0, 7 - last7Days.length) }, (_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-zinc-800/50 border border-white/5 flex items-center justify-center text-[10px] text-zinc-600">•</span>
                <span className="text-[9px] text-zinc-650 font-medium">—</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {last7Days.length === 0 && (
        <div className="text-center text-xs text-zinc-500 py-3">
          هنوز سابقه‌ای ثبت نشده — هر روز حالتو ثبت کن 💜
        </div>
      )}
    </div>
  );
}
