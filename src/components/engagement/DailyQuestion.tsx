'use client';

import { useState } from 'react';

interface DailyQuestionProps {
  question: string;
  onAnswer: (answer: string) => void;
  partnerAnswer?: string;
}

export default function DailyQuestion({
  question,
  onAnswer,
  partnerAnswer,
}: DailyQuestionProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onAnswer(answer.trim());
    setSubmitted(true);
  };

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">💭</span>
        <div>
          <h3 className="text-base font-bold text-zinc-100">سؤال روزانه</h3>
          <p className="text-xs text-zinc-500">هر روز یه سؤال برای نزدیک‌تر شدن</p>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gradient-to-l from-indigo-500/10 to-purple-500/5 border border-indigo-500/15 rounded-2xl p-5 mb-5 text-base font-semibold leading-relaxed text-zinc-100 text-center shadow-inner">
        {question}
      </div>

      {/* Answer input */}
      {!submitted ? (
        <div className="flex flex-col gap-3">
          <textarea
            className="input-field resize-none text-sm leading-relaxed"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="جوابت رو بنویس..."
            rows={3}
          />
          <button
            className="btn btn-primary shadow-lg"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            ✨ ارسال جواب
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Own answer */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm leading-relaxed text-zinc-100">
            <div className="text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <span>✅</span> جواب تو:
            </div>
            {answer}
          </div>

          {/* Partner answer */}
          {partnerAnswer ? (
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4 text-sm leading-relaxed text-zinc-100">
              <div className="text-xs font-bold text-pink-400 mb-1.5 flex items-center gap-1.5">
                <span>💜</span> جواب پارتنرت:
              </div>
              {partnerAnswer}
            </div>
          ) : (
            <div className="text-center p-5 text-sm text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-white/5">
              ⏳ منتظر پاسخ پارتنرت باش... بعد از ارسال پاسخ او، جوابش اینجا نمایش داده میشه.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
