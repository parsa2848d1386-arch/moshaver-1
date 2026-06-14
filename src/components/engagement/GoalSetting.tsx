'use client';

import { useState } from 'react';
import type { SharedGoal } from '@/types';

interface GoalSettingProps {
  goals: SharedGoal[];
  onAdd: (goal: Omit<SharedGoal, 'id'>) => void;
  onUpdate: (goalId: string, progress: number) => void;
  onComplete: (goalId: string) => void;
}

export default function GoalSetting({
  goals,
  onAdd,
  onUpdate,
  onComplete,
}: GoalSettingProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      deadline: deadline || undefined,
      progress: 0,
      status: 'active',
      createdBy: '',
    });
    setTitle('');
    setDescription('');
    setDeadline('');
    setShowForm(false);
  };

  const safeGoals = Array.isArray(goals) ? goals : [];
  const activeGoals = safeGoals.filter((g) => g.status === 'active');
  const completedGoals = safeGoals.filter((g) => g.status === 'completed');

  return (
    <div className="settings-container" style={{ gap: 14 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          🎯 اهداف مشترک
        </h3>
        <button
          className="btn btn-icon btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 16 }}
        >
          ➕
        </button>
      </div>

      {/* Add new goal form */}
      {showForm && (
        <div className="settings-section" style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div className="settings-section-title">🆕 هدف جدید</div>
          <div className="input-group">
            <label className="input-label">عنوان هدف</label>
            <input
              className="input-field"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: هفته‌ای یه شب قرار"
            />
          </div>
          <div className="input-group">
            <label className="input-label">توضیحات</label>
            <textarea
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح بیشتر..."
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label">ددلاین (اختیاری)</label>
            <input
              className="input-field"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              dir="ltr"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={!title.trim()}
            style={{ marginTop: 8 }}
          >
            ✅ افزودن هدف
          </button>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            🟢 اهداف فعال ({activeGoals.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeGoals.map((goal) => (
              <div
                key={goal.id}
                className="settings-section"
                style={{ padding: 16 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700 }}>{goal.title}</h4>
                    {goal.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                        {goal.description}
                      </p>
                    )}
                    {goal.deadline && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        📅 ددلاین: {new Date(goal.deadline).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                  <button
                    className="btn btn-icon btn-secondary"
                    onClick={() => onComplete(goal.id || '')}
                    style={{ fontSize: 14, width: 36, height: 36, minWidth: 36 }}
                    title="تکمیل شد"
                  >
                    ✅
                  </button>
                </div>

                {/* Progress bar */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    <span>پیشرفت</span>
                    <span style={{ direction: 'ltr' }}>{goal.progress}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: 'var(--card-border)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${goal.progress}%`,
                        height: '100%',
                        background:
                          goal.progress >= 80
                            ? 'var(--success-color)'
                            : goal.progress >= 50
                              ? 'var(--warning-color)'
                              : 'var(--primary-color)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  {/* Progress buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {[25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => onUpdate(goal.id || '', val)}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: 8,
                          border: '1px solid var(--card-border)',
                          background:
                            goal.progress >= val
                              ? 'var(--primary-glow)'
                              : 'var(--input-bg)',
                          color:
                            goal.progress >= val
                              ? 'var(--primary-color)'
                              : 'var(--text-muted)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'Vazirmatn, sans-serif',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            🏆 اهداف تکمیل‌شده ({completedGoals.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  padding: '10px 16px',
                  background: 'var(--success-bg)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>🏆</span>
                <span
                  style={{
                    fontSize: 14,
                    color: 'var(--text-main)',
                    textDecoration: 'line-through',
                    opacity: 0.7,
                  }}
                >
                  {goal.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {safeGoals.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <p className="empty-state-text">
            هنوز هدفی ثبت نشده!
            <br />
            یه هدف مشترک بذارید و با هم بهش برسید 💪
          </p>
        </div>
      )}
    </div>
  );
}
