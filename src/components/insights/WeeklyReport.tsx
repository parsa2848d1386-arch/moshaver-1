'use client';

import GottmanRatio from '@/components/insights/GottmanRatio';

interface WeeklyReportData {
  healthScore: number;
  positiveCount: number;
  negativeCount: number;
  gottmanRatio: {
    positive: number;
    negative: number;
    ratio: number;
  };
  suggestedExercise: string;
  summary: string;
  dominantEmotions?: {
    parsa: string[];
    melika: string[];
  };
  unresolvedIssues?: string[];
  positiveHighlights?: string[];
}

interface WeeklyReportProps {
  report: WeeklyReportData;
}

export default function WeeklyReport({ report }: WeeklyReportProps) {
  const scoreColor =
    report.healthScore >= 70
      ? 'var(--success-color)'
      : report.healthScore >= 40
        ? 'var(--warning-color)'
        : 'var(--danger-color)';

  const circumference = 2 * Math.PI * 54; // radius = 54
  const offset = circumference - (report.healthScore / 100) * circumference;

  return (
    <div className="settings-container" style={{ gap: 16 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>📊 گزارش هفتگی</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          خلاصه وضعیت رابطه‌تون در هفته گذشته
        </p>
      </div>

      {/* Health Score - Circular progress */}
      <div className="settings-section" style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
          <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="var(--card-border)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.3s ease' }}
            />
          </svg>
          {/* Score in center */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {report.healthScore}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              از ۱۰۰
            </span>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {report.healthScore >= 70
            ? '💚 وضعیت سالم'
            : report.healthScore >= 40
              ? '🟡 نیاز به توجه'
              : '🔴 نیاز به کمک'}
        </div>
      </div>

      {/* Interaction counts */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div
          className="settings-section"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: 16,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>💚</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success-color)' }}>
            {report.positiveCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>تعامل مثبت</div>
        </div>
        <div
          className="settings-section"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: 16,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>❤️‍🩹</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger-color)' }}>
            {report.negativeCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>تعامل منفی</div>
        </div>
      </div>

      {/* Gottman Ratio */}
      <div className="settings-section">
        <div className="settings-section-title">⚖️ نسبت طلایی گاتمن</div>
        <GottmanRatio
          positive={report.gottmanRatio.positive}
          negative={report.gottmanRatio.negative}
        />
      </div>

      {/* Positive Highlights */}
      {report.positiveHighlights && report.positiveHighlights.length > 0 && (
        <div className="settings-section">
          <div className="settings-section-title">🌟 نکات مثبت</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.positiveHighlights.map((item, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span style={{ color: 'var(--success-color)' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unresolved Issues */}
      {report.unresolvedIssues && report.unresolvedIssues.length > 0 && (
        <div className="settings-section">
          <div className="settings-section-title">⚠️ مسائل حل‌نشده</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.unresolvedIssues.map((item, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span style={{ color: 'var(--warning-color)' }}>●</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="settings-section">
        <div className="settings-section-title">📝 خلاصه</div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}
        >
          {report.summary}
        </p>
      </div>

      {/* Suggested Exercise */}
      <div
        className="settings-section"
        style={{
          background: 'var(--primary-glow)',
          border: '1px solid rgba(129, 140, 248, 0.2)',
        }}
      >
        <div className="settings-section-title" style={{ color: 'var(--primary-color)' }}>
          💡 تمرین پیشنهادی هفته آینده
        </div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-main)',
          }}
        >
          {report.suggestedExercise}
        </p>
      </div>
    </div>
  );
}
