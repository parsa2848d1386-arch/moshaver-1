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
    <div className="glass-panel" style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 24 }}>🎭</span>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>حال و هوای من</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            الان چه حسی داری؟
          </p>
        </div>
      </div>

      {/* Current mood display */}
      {selectedMood && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: 16,
            padding: 16,
            background: 'var(--primary-glow)',
            borderRadius: 16,
            border: '1px solid rgba(129, 140, 248, 0.2)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 6 }}>
            {getMoodEmoji(selectedMood)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
            {MOODS.find((m) => m.value === selectedMood)?.label || selectedMood}
          </div>
        </div>
      )}

      {/* Mood selection grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.value;
          return (
            <button
              key={mood.value}
              onClick={() => onMoodChange(mood.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 6px',
                borderRadius: 14,
                border: isSelected
                  ? '2px solid var(--primary-color)'
                  : '2px solid transparent',
                background: isSelected
                  ? 'var(--primary-glow)'
                  : 'var(--input-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Vazirmatn, sans-serif',
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  transition: 'transform 0.2s ease',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {mood.emoji}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: isSelected
                    ? 'var(--primary-color)'
                    : 'var(--text-muted)',
                }}
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Weekly mood history */}
      {last7Days.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            📅 هفته گذشته:
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: 4,
            }}
          >
            {last7Days.map((entry, idx) => {
              const dayName = new Intl.DateTimeFormat('fa-IR', {
                weekday: 'narrow',
              }).format(new Date(entry.date));
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{getMoodEmoji(entry.mood)}</span>
                  <span
                    style={{
                      fontSize: 9,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {dayName}
                  </span>
                </div>
              );
            })}
            {/* Fill remaining days with empty slots */}
            {Array.from({ length: Math.max(0, 7 - last7Days.length) }, (_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--card-border)',
                    display: 'block',
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--text-muted)',
                  }}
                >
                  —
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {last7Days.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
            padding: 8,
          }}
        >
          هنوز سابقه‌ای ثبت نشده — هر روز حالتو ثبت کن 💜
        </div>
      )}
    </div>
  );
}
