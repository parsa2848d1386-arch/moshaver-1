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
  if (!report) {
    return (
      <div className="settings-section text-center p-8">
        <div className="text-4xl opacity-50 mb-4">📊</div>
        <p className="text-zinc-500 text-sm">گزارشی برای نمایش وجود ندارد. روی دکمه زیر کلیک کنید تا گزارش تولید شود.</p>
      </div>
    );
  }

  const scoreColor =
    report.healthScore >= 70
      ? 'var(--success-color)'
      : report.healthScore >= 40
        ? 'var(--warning-color)'
        : 'var(--danger-color)';

  const circumference = 2 * Math.PI * 54; // radius = 54
  const offset = circumference - (report.healthScore / 100) * circumference;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="text-center mb-1">
        <h3 className="text-base font-bold text-zinc-100 flex items-center justify-center gap-2">
          📊 گزارش هفتگی رابطه
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          خلاصه وضعیت رابطه‌تون در هفته گذشته
        </p>
      </div>

      {/* Health Score - Circular progress */}
      <div className="settings-section flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#12121a] to-zinc-950/40">
        <div className="relative w-32 h-32 flex items-center justify-center mb-3">
          <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            className="-rotate-90 filter drop-shadow-[0_0_12px_rgba(99,102,241,0.15)]"
          >
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="var(--card-border)"
              strokeWidth="7"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke={scoreColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Score in center */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span
              className="text-3xl font-extrabold"
              style={{ color: scoreColor }}
            >
              {report.healthScore}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
              از ۱۰۰
            </span>
          </div>
        </div>
        <div className="text-sm font-bold text-zinc-200 mt-1">
          {report.healthScore >= 70
            ? '💚 وضعیت سالم و پرانرژی'
            : report.healthScore >= 40
              ? '🟡 نیاز به گفتگو و توجه بیشتر'
              : '🔴 هشدار! نیاز به صلح و تفاهم فوری'}
        </div>
      </div>

      {/* Interaction counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="settings-section text-center p-4 bg-emerald-500/5 border-emerald-500/10">
          <div className="text-2xl mb-1">💚</div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {report.positiveCount}
          </div>
          <div className="text-xs text-zinc-500 font-medium">تعامل مثبت</div>
        </div>
        <div className="settings-section text-center p-4 bg-red-500/5 border-red-500/10">
          <div className="text-2xl mb-1">❤️‍🩹</div>
          <div className="text-2xl font-extrabold text-red-400">
            {report.negativeCount}
          </div>
          <div className="text-xs text-zinc-500 font-medium">تعامل منفی</div>
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
          <div className="settings-section-title text-emerald-400">🌟 نکات مثبت هفته</div>
          <div className="flex flex-col gap-2">
            {report.positiveHighlights.map((item, i) => (
              <div
                key={i}
                className="text-sm leading-relaxed text-zinc-300 flex items-start gap-2"
              >
                <span className="text-emerald-400 select-none">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unresolved Issues */}
      {report.unresolvedIssues && report.unresolvedIssues.length > 0 && (
        <div className="settings-section">
          <div className="settings-section-title text-amber-400">⚠️ مسائل حل‌نشده</div>
          <div className="flex flex-col gap-2">
            {report.unresolvedIssues.map((item, i) => (
              <div
                key={i}
                className="text-sm leading-relaxed text-zinc-300 flex items-start gap-2"
              >
                <span className="text-amber-500 select-none">●</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="settings-section">
        <div className="settings-section-title">📝 خلاصه تحلیل کل</div>
        <p className="text-sm leading-relaxed text-zinc-300 text-justify">
          {report.summary}
        </p>
      </div>

      {/* Suggested Exercise */}
      <div className="settings-section bg-gradient-to-l from-indigo-500/10 to-purple-500/5 border-indigo-500/15 p-5">
        <div className="settings-section-title text-indigo-400 mb-2">
          💡 تمرین پیشنهادی برای هفته آینده
        </div>
        <p className="text-sm leading-relaxed text-zinc-200 text-justify">
          {report.suggestedExercise}
        </p>
      </div>
    </div>
  );
}
