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
        <span style={{ fontSize: 28 }}>💭</span>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>سؤال روزانه</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            هر روز یه سؤال برای نزدیک‌تر شدن
          </p>
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          background: 'var(--primary-glow)',
          border: '1px solid rgba(129, 140, 248, 0.2)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 16,
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.7,
          color: 'var(--text-main)',
          textAlign: 'center',
        }}
      >
        {question}
      </div>

      {/* Answer input */}
      {!submitted ? (
        <div>
          <textarea
            className="input-field"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="جوابت رو بنویس..."
            rows={3}
            style={{ resize: 'none', marginBottom: 12 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            ✨ ارسال جواب
          </button>
        </div>
      ) : (
        <div>
          {/* Own answer */}
          <div
            style={{
              background: 'var(--success-bg)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 12,
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--text-main)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--success-color)',
                marginBottom: 6,
              }}
            >
              ✅ جواب تو:
            </div>
            {answer}
          </div>

          {/* Partner answer */}
          {partnerAnswer ? (
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 14,
                padding: '12px 16px',
                fontSize: 14,
                lineHeight: 1.7,
                color: 'var(--text-main)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--secondary-color)',
                  marginBottom: 6,
                }}
              >
                💜 جواب پارتنرت:
              </div>
              {partnerAnswer}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: 16,
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              ⏳ منتظر جواب پارتنرت...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
