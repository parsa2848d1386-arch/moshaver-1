'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useToast } from '@/hooks/useToast';
import { useTyping } from '@/hooks/useTyping';
import type { Message, ChatType, ActiveTab, ToneScore, UserSettings, ConflictSession, SharedGoal, CalendarEvent, DailyQuestion as DailyQuestionType, UserProfile } from '@/types';
import { MOODS } from '@/constants';

// ===== COMPONENTS =====
import ToastContainer from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import OfflineBanner from '@/components/common/OfflineBanner';
import InstallPrompt from '@/components/common/InstallPrompt';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import SearchBar from '@/components/chat/SearchBar';
import ConflictMode from '@/components/chat/ConflictMode';
import SettingsPanel from '@/components/settings/SettingsPanel';
import DailyQuestion from '@/components/engagement/DailyQuestion';
import SharedCalendar from '@/components/engagement/SharedCalendar';
import GoalSetting from '@/components/engagement/GoalSetting';
import ApologyGuide from '@/components/engagement/ApologyGuide';
import ExerciseLibrary from '@/components/engagement/ExerciseLibrary';
import MoodTracker from '@/components/engagement/MoodTracker';
import WeeklyReport from '@/components/insights/WeeklyReport';
import Sidebar from '@/components/layout/Sidebar';

// ===== MAIN PAGE =====
export default function ChatPage() {
  const router = useRouter();
  const { user, profile, loading, error, saveSettings, logout, updateProfile } = useAuth();
  const { toasts, showToast } = useToast();

  // ===== CORE STATES =====
  const [chatType, setChatType] = useState<ChatType>('shared');
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [selectedMood, setSelectedMood] = useState('');
  const [streamingText, setStreamingText] = useState('');

  // ===== FEATURE STATES =====
  const [replyTo, setReplyTo] = useState<Message['replyTo'] | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [toneWarning, setToneWarning] = useState<ToneScore | null>(null);
  const [perspectivePopup, setPerspectivePopup] = useState<{ show: boolean; text: string; loading: boolean }>({ show: false, text: '', loading: false });
  const [showConflictMode, setShowConflictMode] = useState(false);
  const [conflictSession, setConflictSession] = useState<ConflictSession | null>(null);

  // ===== ENGAGEMENT STATES =====
  const [dailyQuestion, setDailyQuestion] = useState<string>('');
  const [goals, setGoals] = useState<SharedGoal[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [showApologyGuide, setShowApologyGuide] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);

  // ===== SETTINGS STATES =====
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [customModelName, setCustomModelName] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [dndEnabled, setDndEnabled] = useState(false);

  // ===== DIALOG STATES =====
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; type: string }>({ show: false, type: '' });

  // ===== HOOKS =====
  const { messages, loading: msgsLoading, hasMore, loadMore, sendMessage, editMessage, deleteMessage, togglePin, addReaction, searchMessages, clearChat } = useMessages(user?.uid || null, chatType);
  const { handleTypingStart } = useTyping(user?.uid || null, chatType);

  // ===== THEME =====
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('moshaver-theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('moshaver-theme') as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // ===== LOAD SETTINGS FROM PROFILE =====
  useEffect(() => {
    if (profile?.settings) {
      setSelectedModel(profile.settings.aiModel || 'gemini-2.5-flash');
      setCustomApiKey(profile.settings.customApiKey || '');
      setCustomModelName(profile.settings.customModelName || '');
      if (profile.settings.theme) setTheme(profile.settings.theme);
      if (profile.settings.dndEnabled) setDndEnabled(profile.settings.dndEnabled);
    }
  }, [profile]);

  // ===== LOAD ENGAGEMENT DATA =====
  useEffect(() => {
    if (!user) return;
    // Load daily question
    fetch('/api/daily-question')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setDailyQuestion(d.question); })
      .catch(console.error);
    // Load goals
    fetch(`/api/goals?uid=${user.uid}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setGoals)
      .catch(console.error);
    // Load calendar
    fetch(`/api/calendar?uid=${user.uid}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setCalendarEvents)
      .catch(console.error);
    // Load mood history
    fetch(`/api/mood?uid=${user.uid}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setMoodHistory)
      .catch(console.error);
  }, [user]);

  // ===== REGISTER SERVICE WORKER (PWA) =====
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  // ===== SEND MESSAGE WITH STREAMING =====
  const handleSendMessage = useCallback(async (text: string, inputMood?: string) => {
    if (!text.trim() || !user || !profile) return;

    setAiTyping(true);
    setToneWarning(null);

    const messageData = {
      text: text.trim(),
      senderId: user.uid,
      senderName: profile.displayName,
      senderRole: profile.role,
      mood: inputMood || undefined,
      replyTo: replyTo || undefined,
    };

    setReplyTo(null);

    try {
      // Save user message
      await sendMessage(messageData);

      // Get AI response via streaming
      const actualModel = selectedModel === 'custom' ? customModelName : selectedModel;
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.slice(-20), { ...messageData, createdAt: new Date().toISOString() }],
          chatType,
          userDisplayName: profile.displayName,
          customModel: actualModel,
          customApiKey: customApiKey || undefined,
          currentMood: messageData.mood,
        }),
      });

      if (!response.ok) throw new Error('مشکلی در پاسخ‌دهی هوش مصنوعی پیش آمد.');

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        setStreamingText('');
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE data
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setStreamingText(fullText);
                }
              } catch {
                fullText += data;
                setStreamingText(fullText);
              }
            }
          }
        }
      }

      // Save AI response as message
      if (fullText) {
        await sendMessage({
          text: fullText,
          senderId: 'ai',
          senderName: 'مشاور همراه',
          senderRole: 'counselor',
        });
      }
      setStreamingText('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'خطا در ارسال پیام', 'error');
      // Fallback to non-streaming
      try {
        const actualModel = selectedModel === 'custom' ? customModelName : selectedModel;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.slice(-20),
            chatType,
            userDisplayName: profile.displayName,
            customModel: actualModel,
            customApiKey: customApiKey || undefined,
            currentMood: selectedMood,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          await sendMessage({
            text: data.text,
            senderId: 'ai',
            senderName: 'مشاور همراه',
            senderRole: 'counselor',
          });
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setAiTyping(false);
    }
  }, [user, profile, messages, chatType, selectedMood, replyTo, selectedModel, customModelName, customApiKey, sendMessage, showToast]);

  // ===== TONE ANALYSIS =====
  const handleAnalyzeTone = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 5) {
      setToneWarning(null);
      return;
    }
    try {
      const res = await fetch('/api/tone-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, apiKey: customApiKey || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.level !== 'safe') {
          setToneWarning(data);
        } else {
          setToneWarning(null);
        }
      }
    } catch (err) {
      console.error('Tone analysis error:', err);
    }
  }, [customApiKey]);

  // ===== NVC TRANSLATE =====
  const handleNvcTranslate = useCallback(async (text: string): Promise<string> => {
    try {
      const res = await fetch('/api/nvc-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, apiKey: customApiKey || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.nvcText || text;
      }
    } catch (err) {
      console.error('NVC translate error:', err);
    }
    return text;
  }, [customApiKey]);

  // ===== PERSPECTIVE ANALYSIS =====
  const handlePerspective = useCallback(async (message: Message) => {
    setPerspectivePopup({ show: true, text: '', loading: true });
    try {
      const context = messages.slice(-5).map((m) => ({
        text: m.text,
        senderRole: m.senderRole,
        senderName: m.senderName,
      }));
      const res = await fetch('/api/perspective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: message.text,
          senderRole: message.senderRole,
          context,
          apiKey: customApiKey || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPerspectivePopup({ show: true, text: data.perspective, loading: false });
      } else {
        setPerspectivePopup({ show: false, text: '', loading: false });
        showToast('خطا در تحلیل دیدگاه', 'error');
      }
    } catch (err) {
      setPerspectivePopup({ show: false, text: '', loading: false });
      showToast('خطا در تحلیل دیدگاه', 'error');
    }
  }, [messages, customApiKey, showToast]);

  // ===== CONFLICT MODE =====
  const handleStartConflict = useCallback(async (topic: string) => {
    try {
      const res = await fetch('/api/conflict-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', topic, uid: user?.uid }),
      });
      if (res.ok) {
        const session = await res.json();
        setConflictSession(session);
        setShowConflictMode(true);
      }
    } catch (err) {
      showToast('خطا در شروع حل تعارض', 'error');
    }
  }, [user, showToast]);

  const handleNextTurn = useCallback(async () => {
    if (!conflictSession?.id) return;
    try {
      const res = await fetch('/api/conflict-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next_turn', sessionId: conflictSession.id, uid: user?.uid }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConflictSession(updated);
      }
    } catch (err) {
      showToast('خطا', 'error');
    }
  }, [conflictSession, user, showToast]);

  const handleEndConflict = useCallback(async () => {
    if (!conflictSession?.id) return;
    try {
      await fetch('/api/conflict-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', sessionId: conflictSession.id, uid: user?.uid }),
      });
      setConflictSession(null);
      setShowConflictMode(false);
      showToast('جلسه حل تعارض پایان یافت ✅', 'success');
    } catch (err) {
      showToast('خطا', 'error');
    }
  }, [conflictSession, user, showToast]);

  // ===== COPY MESSAGE =====
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('پیام کپی شد', 'success');
    } catch {
      showToast('خطا در کپی', 'error');
    }
  }, [showToast]);

  // ===== SAVE SETTINGS =====
  const handleSaveSettings = useCallback(async (profileUpdate: Partial<UserProfile>, settings: UserSettings) => {
    try {
      await saveSettings(profileUpdate.displayName || profile!.displayName, profileUpdate.avatar || profile!.avatar, settings);
      setSelectedModel(settings.aiModel);
      setCustomApiKey(settings.customApiKey);
      setCustomModelName(settings.customModelName);
      setTheme(settings.theme);
      showToast('تنظیمات ذخیره شد ✅', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره', 'error');
    }
  }, [saveSettings, showToast]);

  // ===== CLEAR CHAT =====
  const handleClearChat = useCallback(async () => {
    setConfirmDialog({ show: false, type: '' });
    try {
      await clearChat();
      showToast('تاریخچه چت پاک شد 🗑️', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }, [clearChat, showToast]);

  // ===== EXPORT =====
  const handleExport = useCallback(async () => {
    try {
      const res = await fetch(`/api/export?chatType=${chatType}&uid=${user?.uid}&format=text`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moshaver-chat-${chatType}-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('فایل دانلود شد ✅', 'success');
      }
    } catch (err) {
      showToast('خطا در دانلود', 'error');
    }
  }, [chatType, user, showToast]);

  // ===== LOGOUT =====
  const handleLogout = useCallback(async () => {
    setConfirmDialog({ show: false, type: '' });
    await logout();
  }, [logout]);

  // ===== TAG MEMORY =====
  const handleTagMemory = useCallback(async (messageId: string, messageText: string, tag: string) => {
    try {
      await fetch('/api/memory-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          messageText,
          tag,
          taggedBy: user?.uid,
          uid: user?.uid,
        }),
      });
      showToast('خاطره ذخیره شد 💛', 'success');
    } catch {
      showToast('خطا', 'error');
    }
  }, [user, showToast]);

  // ===== GOAL HANDLERS =====
  const handleAddGoal = useCallback(async (goal: Omit<SharedGoal, 'id' | 'createdAt' | 'progress' | 'status' | 'createdBy'>) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goal, createdBy: user?.uid, uid: user?.uid }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals((prev) => [...prev, data]);
        showToast('هدف اضافه شد ✅', 'success');
      }
    } catch { showToast('خطا', 'error'); }
  }, [user, showToast]);

  const handleUpdateGoal = useCallback(async (goalId: string, updates: Partial<SharedGoal>) => {
    try {
      await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, ...updates }),
      });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g)));
    } catch { showToast('خطا', 'error'); }
  }, [showToast]);

  // ===== CALENDAR HANDLERS =====
  const handleAddEvent = useCallback(async (event: Omit<CalendarEvent, 'id' | 'createdBy'>) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...event, createdBy: user?.uid, uid: user?.uid }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents((prev) => [...prev, data]);
        showToast('رویداد اضافه شد 📅', 'success');
      }
    } catch { showToast('خطا', 'error'); }
  }, [user, showToast]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await fetch('/api/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      setCalendarEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch { showToast('خطا', 'error'); }
  }, [showToast]);

  // ===== SAVE MOOD =====
  const handleMoodChange = useCallback(async (mood: string) => {
    setSelectedMood(mood);
    if (user) {
      fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, mood, date: new Date().toISOString().split('T')[0] }),
      }).catch(console.error);
    }
  }, [user]);

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="mobile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }} className="animate-fade-in">
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // ===== RENDER =====
  return (
    <ErrorBoundary>
      <div className="layout-container">
        <Sidebar
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={() => setConfirmDialog({ show: true, type: 'logout' })}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <div className="main-content">
          <ToastContainer toasts={toasts} />
          <OfflineBanner />
          <InstallPrompt />

        {/* CONFIRM DIALOGS */}
        {confirmDialog.show && confirmDialog.type === 'clear' && (
          <ConfirmDialog
            title="🗑️ پاک کردن تاریخچه"
            message={`آیا مطمئنید که می‌خواهید تمام پیام‌های ${chatType === 'shared' ? 'جلسه دو نفره' : 'چت خصوصی'} را پاک کنید؟`}
            onConfirm={handleClearChat}
            onCancel={() => setConfirmDialog({ show: false, type: '' })}
            confirmText="بله، پاک کن"
            danger
          />
        )}
        {confirmDialog.show && confirmDialog.type === 'logout' && (
          <ConfirmDialog
            title="🚪 خروج از حساب"
            message="آیا می‌خواهید از حساب کاربری خود خارج شوید؟"
            onConfirm={handleLogout}
            onCancel={() => setConfirmDialog({ show: false, type: '' })}
            confirmText="خروج"
            danger
          />
        )}

        {/* PERSPECTIVE POPUP */}
        {perspectivePopup.show && (
          <div className="confirm-overlay" onClick={() => setPerspectivePopup({ show: false, text: '', loading: false })}>
            <div className="perspective-popup confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>🔍 دیدگاه طرف مقابل</h3>
              {perspectivePopup.loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '13px' }}>در حال تحلیل...</p>
                </div>
              ) : (
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {perspectivePopup.text}
                </p>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setPerspectivePopup({ show: false, text: '', loading: false })}
                style={{ marginTop: '16px' }}
              >
                بستن
              </button>
            </div>
          </div>
        )}

        {/* CONFLICT MODE */}
        {showConflictMode && conflictSession && (
          <ConflictMode
            isActive={showConflictMode}
            currentSpeaker={conflictSession.currentSpeaker}
            round={conflictSession.round}
            topic={conflictSession.topic}
            onNextTurn={handleNextTurn}
            onEnd={handleEndConflict}
          />
        )}

        {/* APOLOGY GUIDE */}
        {showApologyGuide && <ApologyGuide onClose={() => setShowApologyGuide(false)} />}

        {/* EXERCISE LIBRARY */}
        {showExercises && <ExerciseLibrary onClose={() => setShowExercises(false)} />}

        {/* HEADER */}
        <ChatHeader
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={() => setConfirmDialog({ show: true, type: 'logout' })}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {error && <div className="error-banner">{error}</div>}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <SettingsPanel
            profile={profile}
            settings={{
              aiModel: selectedModel,
              customApiKey,
              customModelName,
              theme,
              dndEnabled,
            }}
            onSave={handleSaveSettings}
            onClearChat={() => setConfirmDialog({ show: true, type: 'clear' })}
            onExport={handleExport}
          />
        )}

        {/* ===== ENGAGEMENT TAB ===== */}
        {activeTab === 'engagement' && (
          <div className="settings-container">
            {/* سؤال روز */}
            {dailyQuestion && (
              <DailyQuestion
                question={dailyQuestion}
                onAnswer={async (answer) => {
                  try {
                    await fetch('/api/daily-question', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ uid: user?.uid, answer, date: new Date().toISOString().split('T')[0] }),
                    });
                    showToast('پاسخ ثبت شد ✅', 'success');
                  } catch { showToast('خطا', 'error'); }
                }}
              />
            )}

            {/* Mood Tracker */}
            <MoodTracker
              selectedMood={selectedMood}
              onMoodChange={handleMoodChange}
              moodHistory={moodHistory}
            />

            {/* اهداف مشترک */}
            <GoalSetting
              goals={goals}
              onAdd={handleAddGoal}
              onUpdate={(id, progress) => handleUpdateGoal(id, { progress })}
              onComplete={(id) => handleUpdateGoal(id, { status: 'completed', progress: 100 })}
            />

            {/* تقویم */}
            <SharedCalendar
              events={calendarEvents}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
            />

            {/* دکمه‌های ابزار */}
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button className="btn btn-secondary" onClick={() => setShowApologyGuide(true)}>
                🤝 پروتکل آشتی
              </button>
              <button className="btn btn-secondary" onClick={() => setShowExercises(true)}>
                🧘 کتابخانه تمرین‌ها
              </button>
              <button className="btn btn-secondary" onClick={() => {
                const topic = prompt('موضوع اختلاف چیست؟');
                if (topic) handleStartConflict(topic);
              }}>
                ⚖️ شروع حل تعارض
              </button>
            </div>
          </div>
        )}

        {/* ===== INSIGHTS TAB ===== */}
        {activeTab === 'insights' && (
          <div className="settings-container">
            <WeeklyReport report={weeklyReport} />
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/weekly-report?uid=${user?.uid}`);
                  if (res.ok) {
                    const data = await res.json();
                    setWeeklyReport(data);
                  }
                } catch { showToast('خطا در دریافت گزارش', 'error'); }
              }}
            >
              📊 دریافت گزارش هفتگی
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/insights')}
              style={{ marginTop: '10px' }}
            >
              📈 داشبورد تحلیل کامل
            </button>
          </div>
        )}

        {/* ===== CHAT TAB ===== */}
        {activeTab === 'chat' && (
          <>
            {/* SEARCH */}
            {showSearch && (
              <SearchBar
                onSearch={searchMessages}
                onClose={() => setShowSearch(false)}
                onGoToMessage={(msg) => {
                  setShowSearch(false);
                  // scroll to message logic is handled by MessageList
                }}
              />
            )}

            {/* ROOM TABS */}
            <div style={{ padding: '12px 16px 0 16px' }}>
              <div className="rooms-tabs">
                <div
                  className={`room-tab ${chatType === 'shared' ? 'active' : ''}`}
                  onClick={() => setChatType('shared')}
                >
                  👥 جلسه دو نفره
                </div>
                <div
                  className={`room-tab ${chatType === 'private' ? 'active' : ''}`}
                  onClick={() => setChatType('private')}
                >
                  🔒 گفتگوی خصوصی
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <MessageList
              messages={messages}
              loading={msgsLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              pinnedMessages={messages.filter((m) => m.isPinned)}
              currentUserId={user?.uid || ''}
              chatType={chatType}
              aiTyping={aiTyping}
              partnerTyping={false}
              onCopy={handleCopy}
              onReply={(msg) => setReplyTo({ id: msg.id || '', text: msg.text, senderName: msg.senderName })}
              onEdit={(msg) => {
                const newText = window.prompt('متن جدید پیام:', msg.text);
                if (newText && newText !== msg.text) editMessage(msg.id || '', newText);
              }}
              onDelete={(msg) => deleteMessage(msg.id || '')}
              onPin={(msg) => togglePin(msg.id || '', msg.isPinned || false)}
              onReaction={(msg, emoji) => addReaction(msg.id || '', emoji, user?.uid || '')}
              onTagMemory={(msg) => {
                const tag = window.prompt('نام خاطره (مثلاً 💛 سالگرد آشنایی):');
                if (tag) handleTagMemory(msg.id || '', msg.text, tag);
              }}
              onPerspective={handlePerspective}
            />

            {/* INPUT */}
            <ChatInput
              onSend={handleSendMessage}
              disabled={aiTyping}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onVoiceSend={() => showToast('این قابلیت به زودی اضافه می‌شود', 'info')}
              onImageSend={() => showToast('این قابلیت به زودی اضافه می‌شود', 'info')}
              chatType={chatType}
              toneWarning={toneWarning}
              onAnalyzeTone={handleAnalyzeTone}
              onNvcTranslate={handleNvcTranslate}
              onTyping={handleTypingStart}
            />
          </>
        )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
