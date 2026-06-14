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
      <div className="text-center mb-4">
        <div
          className={`text-3xl font-extrabold transition-all duration-300 ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}
          dir="ltr"
        >
          {ratio.toFixed(1)} : 1
        </div>
        <div className="text-xs text-zinc-500 mt-1 font-medium">
          نسبت تعاملات مثبت به منفی
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex h-9 rounded-2xl overflow-hidden mb-4 border border-white/5 shadow-inner">
        {/* Positive bar */}
        <div
          className="bg-emerald-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-500 ease-out"
          style={{
            width: `${positivePercent}%`,
            minWidth: positivePercent > 5 ? 'auto' : '0px',
          }}
        >
          {positivePercent > 15 && `${positive}`}
        </div>
        {/* Negative bar */}
        <div
          className="bg-red-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-500 ease-out"
          style={{
            width: `${negativePercent}%`,
            minWidth: negativePercent > 5 ? 'auto' : '0px',
          }}
        >
          {negativePercent > 15 && `${negative}`}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
          <span className="text-xs text-zinc-400 font-semibold">
            مثبت ({positive})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded bg-red-500" />
          <span className="text-xs text-zinc-400 font-semibold">
            منفی ({negative})
          </span>
        </div>
      </div>

      {/* Status */}
      <div
        className={`flex items-start gap-3.5 p-4 rounded-2xl border ${
          isHealthy
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}
      >
        <span className="text-2xl">{isHealthy ? '💚' : '💔'}</span>
        <div>
          <div
            className={`text-sm font-bold ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {isHealthy ? 'وضعیت سالم' : 'نیاز به بهبود'}
          </div>
          <div className="text-xs text-zinc-400 leading-relaxed mt-1 text-justify">
            {isHealthy
              ? 'نسبت تعاملات مثبت به منفی شما از حد مطلوب ۵:۱ بالاتره. آفرین! 🎉'
              : `نسبت فعلی ${ratio.toFixed(1)}:۱ هست. تلاش کنید به نسبت ۵:۱ نزدیک‌تر بشید.`}
          </div>
        </div>
      </div>

      {/* Golden ratio reference */}
      <div className="mt-4 text-[10px] text-zinc-500 text-center leading-relaxed font-medium">
        📖 طبق تحقیقات دکتر گاتمن، رابطه‌های سالم حداقل ۵ تعامل مثبت به ازای هر ۱ تعامل منفی دارند.
      </div>
    </div>
  );
}
