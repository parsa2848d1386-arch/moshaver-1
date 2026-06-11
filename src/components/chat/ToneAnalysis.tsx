'use client';

import type { ToneScore } from '@/types';

interface ToneAnalysisProps {
  toneScore: ToneScore | null;
  onDismiss: () => void;
  onUseNvc: () => void;
}

export default function ToneAnalysis({
  toneScore,
  onDismiss,
  onUseNvc,
}: ToneAnalysisProps) {
  if (!toneScore || toneScore.level === 'safe') return null;

  const isDanger = toneScore.level === 'danger';

  return (
    <div
      style={{
        padding: '10px 16px',
        background: isDanger ? 'var(--danger-bg)' : 'var(--warning-bg)',
        borderTop: `1px solid ${
          isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)'
        }`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      {/* Warning icon */}
      <span style={{ fontSize: 20 }}>{isDanger ? '🔴' : '🟡'}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isDanger ? 'var(--danger-color)' : 'var(--warning-color)',
            marginBottom: 2,
          }}
        >
          {isDanger ? 'لحن پرخاشگرانه تشخیص داده شد' : 'لحن تند تشخیص داده شد'}
        </div>
        {toneScore.suggestion && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            {toneScore.suggestion}
          </div>
        )}
      </div>

      {/* NVC button */}
      {toneScore.nvcVersion && (
        <button
          onClick={onUseNvc}
          style={{
            background: 'var(--primary-glow)',
            border: '1px solid var(--primary-color)',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--primary-color)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'Vazirmatn, sans-serif',
            transition: 'all 0.2s ease',
          }}
        >
          🕊️ نسخه NVC
        </button>
      )}

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 14,
          padding: '2px 4px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
