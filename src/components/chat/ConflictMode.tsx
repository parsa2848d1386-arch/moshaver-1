'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ConflictModeProps {
  isActive: boolean;
  currentSpeaker: string;
  round: number;
  onNextTurn: () => void;
  onEnd: () => void;
  topic: string;
}

const TURN_DURATION = 180; // 3 minutes in seconds

export default function ConflictMode({
  isActive,
  currentSpeaker,
  round,
  onNextTurn,
  onEnd,
  topic,
}: ConflictModeProps) {
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeLeft(TURN_DURATION);
  }, [currentSpeaker, round]);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentSpeaker, round]);

  const handleNextTurn = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onNextTurn();
  }, [onNextTurn]);

  const handleEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onEnd();
  }, [onEnd]);

  if (!isActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((TURN_DURATION - timeLeft) / TURN_DURATION) * 100;

  return (
    <div
      className="confirm-overlay"
      style={{ alignItems: 'flex-end' }}
    >
      <div
        style={{
          background: 'var(--card-bg-solid)',
          border: '1px solid var(--card-border)',
          borderRadius: '24px 24px 0 0',
          padding: 24,
          width: '100%',
          maxWidth: 520,
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>🕊️ حالت حل تعارض</h3>
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--card-bg)',
              padding: '4px 10px',
              borderRadius: 8,
            }}
          >
            دور {round}
          </span>
        </div>

        {/* Topic */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            موضوع:
          </span>{' '}
          {topic}
        </div>

        {/* Current speaker */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            نوبت صحبت:
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--primary-color)',
            }}
          >
            {currentSpeaker}
          </div>
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color:
                timeLeft < 30
                  ? 'var(--danger-color)'
                  : timeLeft < 60
                    ? 'var(--warning-color)'
                    : 'var(--text-main)',
              direction: 'ltr',
              transition: 'color 0.3s ease',
            }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: 4,
              background: 'var(--card-border)',
              borderRadius: 2,
              marginTop: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background:
                  timeLeft < 30
                    ? 'var(--danger-color)'
                    : 'var(--primary-color)',
                borderRadius: 2,
                transition: 'width 1s linear, background 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* NVC template */}
        <div
          style={{
            background: 'var(--primary-glow)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: 'var(--primary-color)',
              marginBottom: 6,
              fontSize: 14,
            }}
          >
            💡 الگوی ارتباط غیرخشونت‌آمیز (NVC):
          </div>
          <div>
            وقتی <strong>[رفتار/اتفاق]</strong> رو می‌بینم، احساس{' '}
            <strong>[احساس]</strong> می‌کنم، چون نیاز به{' '}
            <strong>[نیاز]</strong> دارم. آیا ممکنه{' '}
            <strong>[درخواست]</strong>؟
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={handleNextTurn}>
            ◀ نوبت بعدی
          </button>
          <button className="btn btn-danger" onClick={handleEnd}>
            ✕ پایان جلسه
          </button>
        </div>
      </div>
    </div>
  );
}
