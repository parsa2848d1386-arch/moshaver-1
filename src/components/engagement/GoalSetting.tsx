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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-base font-bold flex items-center gap-2 text-zinc-100">
          🎯 اهداف مشترک
        </h3>
        <button
          className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 shadow-md text-base"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✖' : '➕'}
        </button>
      </div>

      {/* Add new goal form */}
      {showForm && (
        <div className="settings-section animate-fade-in">
          <div className="settings-section-title">🆕 هدف جدید</div>
          <div className="input-group">
            <label className="input-label">عنوان هدف</label>
            <input
              className="input-field"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: هفته‌ای یک بار شام بیرون"
            />
          </div>
          <div className="input-group">
            <label className="input-label">توضیحات</label>
            <textarea
              className="input-field resize-none text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح بیشتر..."
              rows={2}
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
            className="btn btn-primary mt-2 shadow-lg"
            onClick={handleAdd}
            disabled={!title.trim()}
          >
            ✅ افزودن هدف
          </button>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-zinc-500 mb-2.5 px-1">
            🟢 اهداف فعال ({activeGoals.length})
          </div>
          <div className="flex flex-col gap-3.5">
            {activeGoals.map((goal) => (
              <div
                key={goal.id}
                className="goal-card"
              >
                <div className="goal-card-header">
                  <div>
                    <h4 className="goal-card-title">{goal.title}</h4>
                    {goal.description && (
                      <p className="goal-card-desc mt-1">
                        {goal.description}
                      </p>
                    )}
                    {goal.deadline && (
                      <p className="goal-card-meta mt-1">
                        📅 ددلاین: {new Date(goal.deadline).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                  <button
                    className="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors border border-emerald-500/20 text-sm"
                    onClick={() => onComplete(goal.id || '')}
                    title="تکمیل شد"
                  >
                    ✓
                  </button>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-xs text-zinc-400 mb-1.5 font-medium">
                    <span>پیشرفت</span>
                    <span className="font-semibold text-indigo-400" dir="ltr">{goal.progress}%</span>
                  </div>
                  <div className="goal-progress">
                    <div
                      className="goal-progress-fill"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>

                  {/* Progress buttons */}
                  <div className="flex gap-2 mt-3.5">
                    {[25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => onUpdate(goal.id || '', val)}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                          goal.progress >= val
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:text-zinc-300'
                        }`}
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
          <div className="text-xs font-semibold text-zinc-500 mb-2 px-1">
            🏆 اهداف تکمیل‌شده ({completedGoals.length})
          </div>
          <div className="flex flex-col gap-2">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in"
              >
                <span className="text-lg">🏆</span>
                <span className="text-sm text-zinc-300 line-through opacity-70 flex-1">
                  {goal.title}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">تکمیل شده</span>
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
