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

  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = new Date(ev.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    }
    return map;
  }, [events, currentYear, currentMonth]);

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

  const monthEvents = events.filter((ev) => {
    const d = new Date(ev.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

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
          📅 تقویم مشترک
        </h3>
        <button
          className="btn btn-icon btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ fontSize: 16 }}
        >
          ➕
        </button>
      </div>

      {/* Add event form */}
      {showAddForm && (
        <div
          className="settings-section"
          style={{ animation: 'fadeInUp 0.3s ease' }}
        >
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
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.value}
                  onClick={() => setNewType(et.value)}
                  style={{
                    background:
                      newType === et.value
                        ? 'var(--primary-glow)'
                        : 'var(--input-bg)',
                    border:
                      newType === et.value
                        ? '1.5px solid var(--primary-color)'
                        : '1.5px solid var(--card-border)',
                    borderRadius: 10,
                    padding: '6px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'Vazirmatn, sans-serif',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {et.emoji} {et.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAddEvent}
            disabled={!newTitle.trim() || !newDate}
            style={{ marginTop: 8 }}
          >
            ✅ افزودن رویداد
          </button>
        </div>
      )}

      {/* Calendar grid */}
      <div className="settings-section">
        {/* Month navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <button
            className="btn btn-icon btn-secondary"
            onClick={handlePrevMonth}
            style={{ fontSize: 14 }}
          >
            ▶
          </button>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{monthName}</span>
          <button
            className="btn btn-icon btn-secondary"
            onClick={handleNextMonth}
            style={{ fontSize: 14 }}
          >
            ◀
          </button>
        </div>

        {/* Weekday headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
            marginBottom: 6,
          }}
        >
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '6px 0',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
          }}
        >
          {/* Empty cells for days before first */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} style={{ padding: 8 }} />
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
                style={{
                  textAlign: 'center',
                  padding: '6px 2px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 400,
                  background: isToday ? 'var(--primary-glow)' : 'transparent',
                  border: isToday
                    ? '1px solid var(--primary-color)'
                    : '1px solid transparent',
                  color: isToday ? 'var(--primary-color)' : 'var(--text-main)',
                  position: 'relative',
                  cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                }}
              >
                {day}
                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2,
                      marginTop: 2,
                    }}
                  >
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background:
                            ev.type === 'anniversary'
                              ? 'var(--secondary-color)'
                              : ev.type === 'birthday'
                                ? 'var(--warning-color)'
                                : ev.type === 'therapy'
                                  ? 'var(--success-color)'
                                  : 'var(--primary-color)',
                        }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monthEvents.map((ev) => {
              const typeInfo = EVENT_TYPES.find((et) => et.value === ev.type);
              return (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'var(--input-bg)',
                    borderRadius: 12,
                    border: '1px solid var(--card-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{typeInfo?.emoji || '📌'}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'ltr' }}>
                        {new Date(ev.date).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-icon btn-secondary"
                    onClick={() => onDeleteEvent(ev.id || '')}
                    style={{ fontSize: 12, width: 32, height: 32, minWidth: 32 }}
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
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          📭 هیچ رویدادی برای این ماه ثبت نشده
        </div>
      )}
    </div>
  );
}
