'use client';

import { useState, useMemo } from 'react';
import type { CalendarEvent } from '@/types';

interface SharedCalendarProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EVENT_TYPES: { value: CalendarEvent['type']; label: string; emoji: string }[] = [
  { value: 'anniversary', label: 'سالگرد', emoji: '💍' },
  { value: 'birthday', label: 'تولد', emoji: '🎂' },
  { value: 'therapy', label: 'مشاوره', emoji: '🧠' },
  { value: 'date', label: 'قرار', emoji: '💕' },
  { value: 'custom', label: 'دلخواه', emoji: '📌' },
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // Get day of week (0=Sun, 6=Sat) and convert to Saturday-first (0=Sat)
  const day = new Date(year, month, 1).getDay();
  return (day + 1) % 7;
}

export default function SharedCalendar({
  events,
  onAddEvent,
  onDeleteEvent,
}: SharedCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<CalendarEvent['type']>('date');

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthName = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(currentYear, currentMonth, 1));

  const safeEvents = Array.isArray(events) ? events : [];

  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of safeEvents) {
      const d = new Date(ev.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    }
    return map;
  }, [safeEvents, currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !newDate) return;
    onAddEvent({
      title: newTitle.trim(),
      date: newDate,
      type: newType,
      createdBy: '',
    });
    setNewTitle('');
    setNewDate('');
    setNewType('date');
    setShowAddForm(false);
  };

  const monthEvents = safeEvents.filter((ev) => {
    const d = new Date(ev.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-base font-bold flex items-center gap-2 text-zinc-100">
          📅 تقویم مشترک
        </h3>
        <button
          className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 shadow-md text-base"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✖' : '➕'}
        </button>
      </div>

      {/* Add event form */}
      {showAddForm && (
        <div className="settings-section animate-fade-in">
          <div className="settings-section-title">🆕 رویداد جدید</div>
          <div className="input-group">
            <label className="input-label">عنوان</label>
            <input
              className="input-field"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="عنوان رویداد..."
            />
          </div>
          <div className="input-group">
            <label className="input-label">تاریخ</label>
            <input
              className="input-field"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="input-group">
            <label className="input-label">نوع رویداد</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.value}
                  onClick={() => setNewType(et.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-300 ${
                    newType === et.value
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {et.emoji} {et.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn btn-primary mt-2 shadow-lg"
            onClick={handleAddEvent}
            disabled={!newTitle.trim() || !newDate}
          >
            ✅ افزودن رویداد
          </button>
        </div>
      )}

      {/* Calendar grid */}
      <div className="settings-section p-4">
        {/* Month navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            className="w-9 h-9 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors text-xs"
            onClick={handlePrevMonth}
          >
            ▶
          </button>
          <span className="text-sm font-bold text-zinc-200">{monthName}</span>
          <button
            className="w-9 h-9 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors text-xs"
            onClick={handleNextMonth}
          >
            ◀
          </button>
        </div>

        {/* Weekday headers */}
        <div className="calendar-grid mb-1">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="calendar-header-cell">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="calendar-grid">
          {/* Empty cells for days before first */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayEvents = eventsMap[day.toString()] || [];
            const isToday =
              today.getDate() === day &&
              today.getMonth() === currentMonth &&
              today.getFullYear() === currentYear;

            return (
              <div
                key={day}
                className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-event' : ''}`}
              >
                <span>{day}</span>
                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div
                        key={idx}
                        className={`w-1 h-1 rounded-full ${
                          ev.type === 'anniversary'
                            ? 'bg-rose-450'
                            : ev.type === 'birthday'
                              ? 'bg-amber-400'
                              : ev.type === 'therapy'
                                ? 'bg-emerald-400'
                                : 'bg-blue-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      {monthEvents.length > 0 && (
        <div className="settings-section">
          <div className="settings-section-title">📋 رویدادهای این ماه</div>
          <div className="flex flex-col gap-2">
            {monthEvents.map((ev) => {
              const typeInfo = EVENT_TYPES.find((et) => et.value === ev.type);
              return (
                <div
                  key={ev.id}
                  className="flex justify-between items-center p-3 bg-zinc-900/40 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeInfo?.emoji || '📌'}</span>
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">{ev.title}</div>
                      <div className="text-[10px] text-zinc-500 font-medium direction-ltr text-right mt-0.5">
                        {new Date(ev.date).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors border border-red-500/20 text-xs"
                    onClick={() => onDeleteEvent(ev.id || '')}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {monthEvents.length === 0 && !showAddForm && (
        <div className="text-center p-6 text-xs text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-white/5">
          📭 هیچ رویدادی برای این ماه ثبت نشده
        </div>
      )}
    </div>
  );
}
