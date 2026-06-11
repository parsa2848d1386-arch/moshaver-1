'use client';

import { useState } from 'react';
import { APOLOGY_STEPS } from '@/constants';

interface ApologyGuideProps {
  onClose: () => void;
}

export default function ApologyGuide({ onClose }: ApologyGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userTexts, setUserTexts] = useState<string[]>(
    Array(APOLOGY_STEPS.length).fill(''),
  );

  const step = APOLOGY_STEPS[currentStep];
  const isLast = currentStep === APOLOGY_STEPS.length - 1;
  const isFirst = currentStep === 0;

  const handleTextChange = (value: string) => {
    const updated = [...userTexts];
    updated[currentStep] = value;
    setUserTexts(updated);
  };

  return (
    <div className="confirm-overlay">
      <div
        style={{
          background: 'var(--card-bg-solid)',
          border: '1px solid var(--card-border)',
          borderRadius: 24,
          padding: 24,
          width: '92%',
          maxWidth: 400,
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'bounceIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
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
          <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            🕊️ راهنمای عذرخواهی
          </h3>
          <button
            className="btn btn-icon btn-secondary"
            onClick={onClose}
            style={{ fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {APOLOGY_STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  idx <= currentStep
                    ? 'var(--primary-color)'
                    : 'var(--card-border)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step number */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              border: '2px solid var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--primary-color)',
            }}
          >
            {step.step}
          </div>
          <h4 style={{ fontSize: 16, fontWeight: 700 }}>{step.title}</h4>
        </div>

        {/* Example */}
        <div
          style={{
            background: 'var(--primary-glow)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--primary-color)',
              marginBottom: 6,
            }}
          >
            💡 مثال:
          </div>
          {step.example}
        </div>

        {/* User input */}
        <div className="input-group">
          <label className="input-label">جمله خودت رو بنویس:</label>
          <textarea
            className="input-field"
            value={userTexts[currentStep]}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="با کلمات خودت بنویس..."
            rows={3}
            style={{ resize: 'none' }}
          />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {!isFirst && (
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
              style={{ flex: 1 }}
            >
              ▶ قبلی
            </button>
          )}
          {!isLast ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              style={{ flex: 1 }}
            >
              ◀ بعدی
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              ✅ تکمیل عذرخواهی
            </button>
          )}
        </div>

        {/* Summary when all filled */}
        {isLast && userTexts.every((t) => t.trim()) && (
          <div
            style={{
              marginTop: 16,
              background: 'var(--success-bg)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 14,
              lineHeight: 1.8,
              color: 'var(--text-main)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--success-color)',
                marginBottom: 8,
              }}
            >
              🎉 عذرخواهی کامل تو:
            </div>
            {userTexts.map((text, i) => (
              <p key={i} style={{ marginBottom: 6 }}>
                {text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
