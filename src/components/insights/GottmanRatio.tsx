'use client';

interface GottmanRatioProps {
  positive: number;
  negative: number;
}

export default function GottmanRatio({ positive, negative }: GottmanRatioProps) {
  const total = positive + negative;
  const ratio = negative > 0 ? positive / negative : positive > 0 ? positive : 0;
  const isHealthy = ratio >= 5;
  const positivePercent = total > 0 ? (positive / total) * 100 : 50;
  const negativePercent = total > 0 ? (negative / total) * 100 : 50;

  return (
    <div>
      {/* Ratio display */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: isHealthy ? 'var(--success-color)' : 'var(--danger-color)',
            direction: 'ltr',
          }}
        >
          {ratio.toFixed(1)} : 1
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          نسبت تعاملات مثبت به منفی
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          height: 36,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {/* Positive bar */}
        <div
          style={{
            width: `${positivePercent}%`,
            background: 'var(--success-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'white',
            transition: 'width 0.5s ease',
            minWidth: positivePercent > 5 ? 'auto' : 0,
          }}
        >
          {positivePercent > 15 && `${positive}`}
        </div>
        {/* Negative bar */}
        <div
          style={{
            width: `${negativePercent}%`,
            background: 'var(--danger-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'white',
            transition: 'width 0.5s ease',
            minWidth: negativePercent > 5 ? 'auto' : 0,
          }}
        >
          {negativePercent > 15 && `${negative}`}
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: 'var(--success-color)',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            مثبت ({positive})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: 'var(--danger-color)',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            منفی ({negative})
          </span>
        </div>
      </div>

      {/* Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 12,
          background: isHealthy ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: isHealthy
            ? '1px solid rgba(52, 211, 153, 0.2)'
            : '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <span style={{ fontSize: 20 }}>{isHealthy ? '💚' : '💔'}</span>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isHealthy ? 'var(--success-color)' : 'var(--danger-color)',
            }}
          >
            {isHealthy ? 'وضعیت سالم' : 'نیاز به بهبود'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>
            {isHealthy
              ? 'نسبت تعاملات مثبت به منفی شما از حد مطلوب ۵:۱ بالاتره. آفرین! 🎉'
              : `نسبت فعلی ${ratio.toFixed(1)}:۱ هست. تلاش کنید به نسبت ۵:۱ نزدیک‌تر بشید.`}
          </div>
        </div>
      </div>

      {/* Golden ratio reference */}
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        📖 طبق تحقیقات دکتر گاتمن، رابطه‌های سالم حداقل ۵ تعامل مثبت به ازای هر ۱ تعامل منفی دارند.
      </div>
    </div>
  );
}
