'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// ===== TYPES =====
interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

interface UserSettings {
  aiModel: string;
  customApiKey: string;
  customModelName: string;
  theme: 'dark' | 'light';
}

interface UserProfile {
  uid: string;
  displayName: string;
  role: 'parsa' | 'melika';
  avatar: string;
  email: string;
  createdAt?: string;
  settings?: UserSettings;
}

// ===== AI MODELS =====
const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'سریع و اقتصادی' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'قدرتمند و دقیق' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'نسخه قبلی سریع' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'پایدار و مطمئن' },
  { id: 'custom', name: 'مدل دلخواه ✏️', desc: 'مدل خودت رو وارد کن' },
];

const AVATARS = ['👨‍💻', '👩‍🎨', '🧸', '🌸', '☕', '🪐', '🍀', '✨', '🦋', '🌙', '🔥', '💎'];

// ===== TOAST COMPONENT =====
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  exiting?: boolean;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ===== CONFIRM DIALOG =====
function ConfirmDialog({ 
  title, message, onConfirm, onCancel, confirmText = 'تأیید', cancelText = 'انصراف', danger = false 
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 1 }}>
            {confirmText}
          </button>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatType, setChatType] = useState<'shared' | 'private'>('shared');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  
  // Advanced Features states
  const [selectedMood, setSelectedMood] = useState<string>('');
  const MOODS = [
    { emoji: '😊', label: 'آرام', value: 'آرام و خوشحال' },
    { emoji: '😔', label: 'ناراحت', value: 'ناراحت و غمگین' },
    { emoji: '😠', label: 'عصبانی', value: 'عصبانی و کلافه' },
    { emoji: '🤔', label: 'گیج', value: 'سردرگم' },
    { emoji: '❤️', label: 'عاشقانه', value: 'عاشقانه' }
  ];
  
  // Settings states
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('👨‍💻');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [customModelName, setCustomModelName] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; type: string }>({ show: false, type: '' });
  
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<any>(null);

  // ===== TOAST HELPER =====
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  // ===== THEME =====
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('moshaver-theme', theme);
  }, [theme]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('moshaver-theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // ===== AUTH =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setError('');
        
        try {
          const res = await fetch(`/api/user?uid=${firebaseUser.uid}`);
          
          if (res.ok) {
            const profileData = await res.json() as UserProfile;
            setProfile(profileData);
            setEditName(profileData.displayName);
            setEditAvatar(profileData.avatar);
            
            // بارگذاری تنظیمات
            if (profileData.settings) {
              setSelectedModel(profileData.settings.aiModel || 'gemini-2.5-flash');
              setCustomApiKey(profileData.settings.customApiKey || '');
              setCustomModelName(profileData.settings.customModelName || '');
              if (profileData.settings.theme) {
                setTheme(profileData.settings.theme);
              }
            }
          } else {
            router.push('/login');
          }
        } catch (err: any) {
          console.error("Profile load error:", err);
          setError('خطا در بارگذاری اطلاعات. لطفاً صفحه را رفرش کنید.');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // ===== FETCH MESSAGES =====
  const fetchMessages = useCallback(async () => {
    if (!user || !profile) return;
    
    try {
      const res = await fetch(`/api/messages?chatType=${chatType}&uid=${user.uid}`);
      if (res.ok) {
        const msgs = await res.json() as Message[];
        
        setMessages((prev) => {
          if (prev.length !== msgs.length || 
              (prev.length > 0 && msgs.length > 0 && prev[prev.length - 1].text !== msgs[msgs.length - 1].text)) {
            return msgs;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [user, profile, chatType]);

  // ===== POLLING =====
  useEffect(() => {
    if (!user || !profile) return;

    fetchMessages();
    pollingIntervalRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, profile, chatType, fetchMessages]);

  // ===== AUTO SCROLL =====
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ===== SCROLL DETECTION =====
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  // ===== SEND MESSAGE =====
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !profile) return;

    const textToSend = inputText.trim();
    setInputText('');
    setAiTyping(true);

    const messageData = {
      chatType,
      uid: user.uid,
      text: textToSend,
      senderId: user.uid,
      senderName: profile.displayName,
      senderRole: profile.role,
      mood: selectedMood || undefined,
    };

    // Reset mood after sending
    setSelectedMood('');

    try {
      const saveUserRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (!saveUserRes.ok) throw new Error('خطا در ارسال پیام.');

      await fetchMessages();

      const localContext = [...messages, { ...messageData, createdAt: new Date().toISOString() }];

      // ارسال مدل و API Key سفارشی به سرور
      const actualModel = selectedModel === 'custom' ? customModelName : selectedModel;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: localContext,
          chatType,
          userDisplayName: profile.displayName,
          customModel: actualModel,
          customApiKey: customApiKey || undefined,
          currentMood: messageData.mood,
        }),
      });

      if (!res.ok) throw new Error('مشکلی در پاسخ‌دهی هوش مصنوعی پیش آمد.');

      const data = await res.json();
      
      const aiMessageData = {
        chatType,
        uid: user.uid,
        text: data.text,
        senderId: 'ai',
        senderName: 'مشاور همراه',
        senderRole: 'counselor',
      };
      
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMessageData),
      });

      await fetchMessages();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'خطا در ارسال پیام', 'error');
      
      const errorMessage = {
        chatType,
        uid: user.uid,
        text: `خطا: ${err.message}`,
        senderId: 'ai',
        senderName: 'سیستم',
        senderRole: 'system',
      };
      
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorMessage),
      });
      await fetchMessages();
    } finally {
      setAiTyping(false);
    }
  };

  // ===== COPY MESSAGE =====
  const handleCopyMessage = async (msgId: string | undefined, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId || null);
      showToast('پیام کپی شد', 'success');
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      showToast('خطا در کپی پیام', 'error');
    }
  };

  // ===== FORMAT TIME =====
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

  // ===== SAVE SETTINGS =====
  const handleSaveSettings = async () => {
    if (!user || !profile) return;
    
    try {
      const newSettings: UserSettings = {
        aiModel: selectedModel,
        customApiKey,
        customModelName,
        theme,
      };

      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          displayName: editName.trim() || profile.displayName,
          avatar: editAvatar,
          settings: newSettings,
          isUpdate: true,
        }),
      });

      if (!res.ok) throw new Error('خطا در ذخیره تنظیمات');
      
      setProfile((prev: any) => ({
        ...prev,
        displayName: editName.trim() || prev.displayName,
        avatar: editAvatar,
        settings: newSettings,
      }));
      
      showToast('تنظیمات با موفقیت ذخیره شد ✅', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره تنظیمات', 'error');
    }
  };

  // ===== CLEAR CHAT =====
  const handleClearChat = async () => {
    if (!user) return;
    setConfirmDialog({ show: false, type: '' });
    
    try {
      const res = await fetch('/api/chat/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType, uid: user.uid }),
      });

      if (!res.ok) throw new Error('خطا در پاک کردن چت');
      
      setMessages([]);
      showToast('تاریخچه چت پاک شد 🗑️', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در پاک کردن چت', 'error');
    }
  };

  // ===== LOGOUT =====
  const handleLogout = async () => {
    setConfirmDialog({ show: false, type: '' });
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    await signOut(auth);
    router.push('/login');
  };

  // ===== CHAR COUNTER =====
  const getCharCounterClass = () => {
    const len = inputText.length;
    if (len > 1500) return 'char-counter active danger';
    if (len > 1000) return 'char-counter active warning';
    if (len > 0) return 'char-counter active';
    return 'char-counter';
  };

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
    <div className="mobile-container">
      <ToastContainer toasts={toasts} />
      
      {/* CONFIRM DIALOGS */}
      {confirmDialog.show && confirmDialog.type === 'clear' && (
        <ConfirmDialog
          title="🗑️ پاک کردن تاریخچه"
          message={`آیا مطمئنید که می‌خواهید تمام پیام‌های ${chatType === 'shared' ? 'جلسه دو نفره' : 'چت خصوصی'} را پاک کنید؟ این عمل قابل بازگشت نیست.`}
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

      {/* HEADER */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '14px', 
            background: 'var(--primary-glow)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '22px',
            border: '1.5px solid var(--card-border)'
          }}>
            {profile.avatar}
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>{profile.displayName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ 
                width: '6px', height: '6px', borderRadius: '50%', 
                background: '#34d399', display: 'inline-block',
                boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)'
              }}></span>
              <span style={{ fontSize: '11px', color: '#34d399' }}>آنلاین</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => router.push('/insights')} 
            className="btn btn-secondary btn-icon"
            title="داشبورد تحلیل رابطه"
          >
            📊
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === 'settings' ? 'chat' : 'settings')} 
            className="btn btn-secondary btn-icon"
            title="تنظیمات"
            style={{ 
              background: activeTab === 'settings' ? 'var(--primary-glow)' : undefined,
              borderColor: activeTab === 'settings' ? 'var(--primary-color)' : undefined,
            }}
          >
            {activeTab === 'settings' ? '💬' : '⚙️'}
          </button>
          <button 
            onClick={() => setConfirmDialog({ show: true, type: 'logout' })}
            className="btn btn-secondary btn-icon"
            title="خروج"
            style={{ color: 'var(--danger-color)' }}
          >
            🚪
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === 'settings' ? (
        <div className="settings-container">
          
          {/* پروفایل */}
          <div className="settings-section">
            <div className="settings-section-title">👤 پروفایل</div>
            
            <div className="input-group">
              <label className="input-label">نام نمایشی</label>
              <input 
                type="text" 
                className="input-field" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="نام شما..."
              />
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">آواتار</label>
              <div className="profile-avatar-select">
                {AVATARS.map((emoji) => (
                  <div 
                    key={emoji}
                    className={`avatar-option ${editAvatar === emoji ? 'selected' : ''}`}
                    onClick={() => setEditAvatar(emoji)}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* مدل هوش مصنوعی */}
          <div className="settings-section">
            <div className="settings-section-title">🤖 مدل هوش مصنوعی</div>
            
            <div className="model-grid">
              {AI_MODELS.map((model) => (
                <div 
                  key={model.id}
                  className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <span className="model-name">{model.name}</span>
                  <span className="model-desc">{model.desc}</span>
                </div>
              ))}
            </div>

            {selectedModel === 'custom' && (
              <div className="input-group animate-fade-in" style={{ marginTop: '12px' }}>
                <label className="input-label">نام مدل دلخواه</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="مثال: gemini-2.0-flash-lite"
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'left', fontFamily: 'monospace, Vazirmatn' }}
                />
              </div>
            )}
          </div>

          {/* کلید API */}
          <div className="settings-section">
            <div className="settings-section-title">🔑 کلید API اختصاصی</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.7' }}>
              اگر کلید API شخصی دارید، اینجا وارد کنید. در غیر اینصورت از کلید پیش‌فرض استفاده می‌شود.
            </p>
            
            <div className="input-group" style={{ marginBottom: '0' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showApiKey ? 'text' : 'password'}
                  className="input-field"
                  placeholder="AIza..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'left', fontFamily: 'monospace, Vazirmatn', paddingLeft: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                  }}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {/* ظاهر */}
          <div className="settings-section">
            <div className="settings-section-title">🎨 ظاهر برنامه</div>
            
            <div className="settings-row">
              <span className="settings-row-label">حالت تاریک</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* اطلاعات حساب */}
          <div className="settings-section">
            <div className="settings-section-title">📋 اطلاعات حساب</div>
            
            <div className="settings-row">
              <span className="settings-row-label">ایمیل</span>
              <span className="settings-row-value">{profile.email}</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">نقش</span>
              <span className="settings-row-value">{profile.role === 'parsa' ? 'پارسا 👨‍💻' : 'ملیکا 👩‍🎨'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">مدل فعال</span>
              <span className="settings-row-value" style={{ direction: 'ltr' }}>
                {selectedModel === 'custom' ? customModelName || '—' : selectedModel}
              </span>
            </div>
            {profile.createdAt && (
              <div className="settings-row">
                <span className="settings-row-label">تاریخ عضویت</span>
                <span className="settings-row-value">
                  {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(profile.createdAt))}
                </span>
              </div>
            )}
          </div>

          {/* عملیات‌ها */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px' }}>
            <button onClick={handleSaveSettings} className="btn btn-primary">
              💾 ذخیره تمام تنظیمات
            </button>
            <button 
              onClick={() => setConfirmDialog({ show: true, type: 'clear' })} 
              className="btn btn-danger"
            >
              🗑️ پاک کردن تاریخچه چت فعلی
            </button>
          </div>
        </div>
      ) : (
        /* ===== CHAT TAB ===== */
        <>
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
          <div 
            className="chat-messages" 
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">
                  {chatType === 'shared' ? '💬' : '🔒'}
                </span>
                <p className="empty-state-text">
                  {chatType === 'shared' 
                    ? 'هنوز پیامی در جلسه دونفره نیست. برای شروع مشاوره، پیامی بنویسید.'
                    : 'این فضا کاملاً خصوصی است. پارتنر شما پیام‌های این بخش را نمی‌بیند.'}
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isAi = msg.senderId === 'ai';
                
                let wrapperClass = 'message-wrapper';
                if (isAi) {
                  wrapperClass += ' ai';
                } else {
                  wrapperClass += ' user';
                  if (msg.senderRole === 'parsa') wrapperClass += ' parsa';
                  else if (msg.senderRole === 'melika') wrapperClass += ' melika';
                }

                return (
                  <div key={msg.id || index} className={wrapperClass}>
                    <span className="message-sender">
                      {isAi ? '🧙‍♂️ ' : ''}{msg.senderName}
                      {!isAi && ` (${msg.senderRole === 'parsa' ? 'پارسا' : 'ملیکا'})`}
                    </span>
                    <div className="message-bubble">
                      <div className="message-actions">
                        <button 
                          className="copy-btn" 
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          title="کپی پیام"
                        >
                          {copiedMsgId === msg.id ? '✓' : '📋'}
                        </button>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
                    </div>
                    {msg.createdAt && (
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    )}
                  </div>
                );
              })
            )}

            {/* TYPING INDICATOR */}
            {aiTyping && (
              <div className="message-wrapper ai">
                <span className="message-sender">🧙‍♂️ مشاور همراه</span>
                <div className="message-bubble" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '14px 20px' }}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* SCROLL TO BOTTOM */}
          {showScrollBtn && (
            <button className="scroll-to-bottom" onClick={scrollToBottom}>
              ↓
            </button>
          )}

          {/* INPUT AREA */}
          <div>
            {inputText.length > 0 && (
              <div className={getCharCounterClass()} style={{ padding: '0 20px', marginBottom: '2px' }}>
                {inputText.length} کاراکتر
              </div>
            )}
            <form onSubmit={handleSendMessage} className="chat-input-area" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              
              {/* Mood Selector */}
              <div style={{ display: 'flex', gap: '8px', padding: '0 8px', overflowX: 'auto', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', whiteSpace: 'nowrap' }}>حس الانم:</span>
                {MOODS.map(m => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setSelectedMood(selectedMood === m.value ? '' : m.value)}
                    style={{
                      background: selectedMood === m.value ? 'var(--primary-glow)' : 'transparent',
                      border: `1px solid ${selectedMood === m.value ? 'var(--primary-color)' : 'var(--card-border)'}`,
                      borderRadius: '12px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', width: '100%' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={chatType === 'shared' ? 'پیامی برای جلسه بنویسید...' : 'به صورت خصوصی صحبت کنید...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={aiTyping}
                  style={{ flex: 1, borderRadius: '22px', padding: '11px 18px', fontSize: '14.5px' }}
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim() || aiTyping}
                  className="btn btn-primary"
                  style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '50%', 
                    padding: '0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '18px',
                  }}
                >
                  {aiTyping ? (
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  ) : '🚀'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
