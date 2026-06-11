'use client';

import { useState, useMemo } from 'react';
import { EXERCISES } from '@/constants';
import type { Exercise } from '@/types';

interface ExerciseLibraryProps {
  onClose: () => void;
}

const CATEGORY_LABELS: Record<Exercise['category'], { label: string; emoji: string }> = {
  breathing: { label: 'تنفس', emoji: '🌬️' },
  meditation: { label: 'مدیتیشن', emoji: '🧘' },
  communication: { label: 'ارتباط', emoji: '💬' },
  gratitude: { label: 'قدردانی', emoji: '🙏' },
  conflict: { label: 'تعارض', emoji: '🕊️' },
};

export default function ExerciseLibrary({ onClose }: ExerciseLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<Exercise['category'] | 'all'>(
    'all',
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      ['all', ...Object.keys(CATEGORY_LABELS)] as (Exercise['category'] | 'all')[],
    [],
  );

  const filteredExercises = useMemo(
    () =>
      selectedCategory === 'all'
        ? EXERCISES
        : EXERCISES.filter((ex) => ex.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div
        style={{
          background: 'var(--card-bg-solid)',
          border: '1px solid var(--card-border)',
          borderRadius: 24,
          padding: 24,
          width: '92%',
          maxWidth: 440,
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
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            📚 کتابخانه تمرین‌ها
          </h3>
          <button
            className="btn btn-icon btn-secondary"
            onClick={onClose}
            style={{ fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        {/* Category filter */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              background:
                selectedCategory === 'all'
                  ? 'var(--primary-glow)'
                  : 'var(--input-bg)',
              border:
                selectedCategory === 'all'
                  ? '1.5px solid var(--primary-color)'
                  : '1.5px solid var(--card-border)',
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color:
                selectedCategory === 'all'
                  ? 'var(--primary-color)'
                  : 'var(--text-secondary)',
              fontFamily: 'Vazirmatn, sans-serif',
              transition: 'all 0.2s ease',
            }}
          >
            🌐 همه
          </button>
          {categories
            .filter((c) => c !== 'all')
            .map((cat) => {
              const info = CATEGORY_LABELS[cat as Exercise['category']];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background:
                      selectedCategory === cat
                        ? 'var(--primary-glow)'
                        : 'var(--input-bg)',
                    border:
                      selectedCategory === cat
                        ? '1.5px solid var(--primary-color)'
                        : '1.5px solid var(--card-border)',
                    borderRadius: 10,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color:
                      selectedCategory === cat
                        ? 'var(--primary-color)'
                        : 'var(--text-secondary)',
                    fontFamily: 'Vazirmatn, sans-serif',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {info.emoji} {info.label}
                </button>
              );
            })}
        </div>

        {/* Exercises list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredExercises.map((exercise) => {
            const catInfo = CATEGORY_LABELS[exercise.category];
            const isExpanded = expandedId === exercise.id;

            return (
              <div
                key={exercise.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : exercise.id)
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{catInfo.emoji}</span>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700 }}>
                        {exercise.title}
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginTop: 4,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>⏱ {exercise.duration}</span>
                        <span>📂 {catInfo.label}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 16px 16px',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                        marginBottom: 12,
                      }}
                    >
                      {exercise.description}
                    </p>

                    <div
                      style={{
                        background: 'var(--input-bg)',
                        borderRadius: 12,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--primary-color)',
                          marginBottom: 10,
                        }}
                      >
                        📝 مراحل:
                      </div>
                      {exercise.steps.map((step, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginBottom: 8,
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: 'var(--text-main)',
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              minWidth: 22,
                              borderRadius: '50%',
                              background: 'var(--primary-glow)',
                              color: 'var(--primary-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              marginTop: 2,
                            }}
                          >
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 24,
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            تمرینی در این دسته‌بندی پیدا نشد
          </div>
        )}
      </div>
    </div>
  );
}
