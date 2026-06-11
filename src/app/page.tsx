'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: any;
}

interface UserProfile {
  uid: string;
  displayName: string;
  role: 'parsa' | 'melika';
  avatar: string;
  email: string;
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatType, setChatType] = useState<'shared' | 'private'>('shared');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Profile edit states
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('👨‍💻');
  
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Load User Profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setProfile(profileData);
          setEditName(profileData.displayName);
          setEditAvatar(profileData.avatar);
        } else {
          // If no profile (edge case), redirect to login for setup
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load and listen to messages in real-time based on chatType
  useEffect(() => {
    if (!user || !profile) return;

    let q;
    if (chatType === 'shared') {
      // Shared chatroom
      const sharedRef = collection(db, 'shared_chats');
      q = query(sharedRef, orderBy('createdAt', 'asc'));
    } else {
      // Private chatroom for current user
      const privateRef = collection(db, 'private_chats', user.uid, 'messages');
      q = query(privateRef, orderBy('createdAt', 'asc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [user, profile, chatType]);

  // Scroll chat window to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !profile) return;

    const textToSend = inputText.trim();
    setInputText('');
    setAiTyping(true);

    const messageData = {
      text: textToSend,
      senderId: user.uid,
      senderName: profile.displayName,
      senderRole: profile.role,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save user message to Firestore
      let chatCollectionRef;
      if (chatType === 'shared') {
        chatCollectionRef = collection(db, 'shared_chats');
      } else {
        chatCollectionRef = collection(db, 'private_chats', user.uid, 'messages');
      }
      await addDoc(chatCollectionRef, messageData);
      scrollToBottom();

      // 2. Fetch entire recent messages from local state for Gemini API context
      const localContext = [...messages, messageData];

      // 3. Request AI response from server-side Route handler
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: localContext,
          chatType: chatType,
          userDisplayName: profile.displayName,
        }),
      });

      if (!res.ok) {
        throw new Error('مشکلی در سرور پیش آمد.');
      }

      const data = await res.json();
      
      // 4. Save AI message to Firestore
      const aiMessageData = {
        text: data.text,
        senderId: 'ai',
        senderName: 'مشاور همراه',
        senderRole: 'counselor',
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(chatCollectionRef, aiMessageData);

    } catch (err) {
      console.error(err);
      // Fallback message insertion on error
      const errorMessage = {
        text: 'در حال حاضر ارتباط با مشاور هوش مصنوعی قطع است. لطفاً اتصال اینترنت خود را بررسی کنید یا کلیدهای امنیتی را مجدد چک کنید.',
        senderId: 'ai',
        senderName: 'سیستم',
        senderRole: 'system',
        createdAt: new Date().toISOString(),
      };
      
      let chatCollectionRef;
      if (chatType === 'shared') {
        chatCollectionRef = collection(db, 'shared_chats');
      } else {
        chatCollectionRef = collection(db, 'private_chats', user.uid, 'messages');
      }
      await addDoc(chatCollectionRef, errorMessage);
    } finally {
      setAiTyping(false);
      scrollToBottom();
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: editName.trim(),
        avatar: editAvatar,
      });
      
      setProfile((prev: any) => ({
        ...prev,
        displayName: editName.trim(),
        avatar: editAvatar,
      }));
      
      setShowSettings(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('خطا در به‌روزرسانی اطلاعات.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="mobile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '48px', animation: 'pulse 1.5s infinite' }}>🕯️</span>
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mobile-container">
      
      {/* HEADER */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{profile.avatar}</span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>{profile.displayName}</h2>
            <span style={{ fontSize: '11px', color: '#10b981' }}>آنلاین</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '13px', width: 'auto' }}
          >
            ⚙️ تنظیمات
          </button>
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '13px', width: 'auto', color: '#f87171' }}
          >
            خروج
          </button>
        </div>
      </header>

      {/* SETTINGS MODAL / PANEL */}
      {showSettings ? (
        <div className="glass-panel animate-fade-in" style={{ flex: 1, margin: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>تنظیمات پروفایل</h2>
          
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">نام نمایشی</label>
              <input 
                type="text" 
                className="input-field" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">انتخاب آواتار</label>
              <div className="profile-avatar-select">
                {['👨‍💻', '👩‍🎨', '🧸', '🌸', '☕', '🪐', '🍀', '✨'].map((emoji) => (
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>ذخیره تغییرات</button>
              <button 
                type="button" 
                onClick={() => setShowSettings(false)} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* CHAT INTERFACE */
        <>
          {/* ROOM SELECTION TABS */}
          <div style={{ padding: '16px 16px 0 16px' }}>
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

          {/* MESSAGES WINDOW */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '20px',
                gap: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>💬</span>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {chatType === 'shared' 
                    ? 'هیچ پیامی در جلسه دونفره وجود ندارد. برای شروع جلسه با مشاور رابطه پیامی بنویسید.'
                    : 'این فضا کاملاً خصوصی است. پارتنر شما پیام‌های این بخش را نمی‌بیند. می‌توانید سوال یا دغدغه خصوصی خود را بنویسید.'}
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isAi = msg.senderId === 'ai';
                const isSystem = msg.senderRole === 'system';
                
                // Style wrapper based on sender
                let wrapperClass = 'message-wrapper';
                let senderName = msg.senderName;
                
                if (isAi) {
                  wrapperClass += ' ai';
                } else {
                  wrapperClass += ' user';
                  if (msg.senderRole === 'parsa') {
                    wrapperClass += ' parsa';
                  } else if (msg.senderRole === 'melika') {
                    wrapperClass += ' melika';
                  }
                }

                return (
                  <div key={msg.id || index} className={wrapperClass}>
                    <span className="message-sender">
                      {isAi ? '🧙‍♂️ ' : ''}{senderName} 
                      {!isAi && ` (${msg.senderRole === 'parsa' ? 'پارسا' : 'ملیکا'})`}
                    </span>
                    <div className="message-bubble">
                      <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}

            {/* AI TYPING INDICATOR */}
            {aiTyping && (
              <div className="message-wrapper ai" style={{ alignSelf: 'flex-start' }}>
                <span className="message-sender">مشاور همراه</span>
                <div className="message-bubble" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '14px 20px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite alternate' }}></span>
                  <span style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.2s' }}></span>
                  <span style={{ width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.4s' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input 
              type="text" 
              className="input-field" 
              placeholder={chatType === 'shared' ? 'پیامی برای جلسه بنویسید...' : 'به صورت خصوصی با مشاور صحبت کنید...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={aiTyping}
              style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', fontSize: '15px' }}
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
                opacity: (!inputText.trim() || aiTyping) ? 0.6 : 1
              }}
            >
              🚀
            </button>
          </form>
        </>
      )}
    </div>
  );
}
