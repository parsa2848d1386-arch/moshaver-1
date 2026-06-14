'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
import {
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message, ChatType, PaginatedResponse } from '@/types';
import { MESSAGE_PAGE_SIZE } from '@/constants';
import { toast } from 'sonner';

export function useMessages(uid: string | null, chatType: ChatType) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);
  const oldestDocRef = useRef<QueryDocumentSnapshot | null>(null);

  // ===== REALTIME LISTENER (replaces polling) =====
  useEffect(() => {
    if (!uid) return;

    setLoading(true);

    const colPath =
      chatType === 'shared'
        ? 'shared_chats'
        : `private_chats/${uid}/messages`;

    const q = query(
      collection(db, colPath),
      orderBy('createdAt', 'desc'),
      limit(MESSAGE_PAGE_SIZE)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((d) => {
          msgs.push({ id: d.id, ...d.data() } as Message);
        });

        // Store oldest doc for pagination
        if (snapshot.docs.length > 0) {
          oldestDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        }

        setMessages(msgs.reverse()); // show oldest first
        setHasMore(snapshot.docs.length >= MESSAGE_PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        console.error('Realtime listener error:', err);
        setLoading(false);
        toast.error('خطا در دریافت لحظه‌ای پیام‌ها');
      }
    );

    unsubRef.current = unsub;
    return () => unsub();
  }, [uid, chatType]);

  // ===== LOAD MORE (PAGINATION) =====
  const loadMore = useCallback(async () => {
    if (!uid || !oldestDocRef.current || !hasMore) return;

    const colPath =
      chatType === 'shared'
        ? 'shared_chats'
        : `private_chats/${uid}/messages`;

    const q = query(
      collection(db, colPath),
      orderBy('createdAt', 'desc'),
      startAfter(oldestDocRef.current),
      limit(MESSAGE_PAGE_SIZE)
    );

    const snapshot = await getDocs(q);
    const older: Message[] = [];
    snapshot.forEach((d) => {
      older.push({ id: d.id, ...d.data() } as Message);
    });

    if (snapshot.docs.length > 0) {
      oldestDocRef.current = snapshot.docs[snapshot.docs.length - 1];
    }

    setHasMore(snapshot.docs.length >= MESSAGE_PAGE_SIZE);
    setMessages((prev) => [...older.reverse(), ...prev]);
  }, [uid, chatType, hasMore]);

  // ===== SEND MESSAGE =====
  const sendMessage = useCallback(
    async (data: {
      text: string;
      senderId: string;
      senderName: string;
      senderRole: string;
      mood?: string;
      replyTo?: Message['replyTo'];
      imageUrl?: string;
      voiceUrl?: string;
      voiceDuration?: number;
    }) => {
      // Haptic Feedback
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Sound Effect
      try {
         const audio = new Audio('/sounds/send.mp3');
         audio.volume = 0.5;
         audio.play().catch(() => {});
      } catch (e) {}

      // Optimistic Update
      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        ...data,
        createdAt: new Date().toISOString(),
        status: 'sending'
      };

      setMessages(prev => [...prev, tempMessage]);

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatType,
            uid,
            ...data,
          }),
        });
        
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'خطا در ارسال پیام.');
        }

        const responseData = await res.json();
        
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, id: responseData.id, status: 'sent' } : msg
        ));
        
        return responseData;
      } catch (error: any) {
        toast.error(error.message || 'مشکلی پیش آمد.');
        // Set error status
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'error' } : msg
        ));
        throw error;
      }
    },
    [uid, chatType]
  );

  // ===== EDIT MESSAGE =====
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType, uid, text: newText }),
      });
      if (!res.ok) throw new Error('خطا در ویرایش پیام');
    },
    [uid, chatType]
  );

  // ===== DELETE MESSAGE =====
  const deleteMessage = useCallback(
    async (messageId: string) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType, uid }),
      });
      if (!res.ok) throw new Error('خطا در حذف پیام');
    },
    [uid, chatType]
  );

  // ===== TOGGLE PIN =====
  const togglePin = useCallback(
    async (messageId: string, isPinned: boolean) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType, uid, isPinned: !isPinned }),
      });
      if (!res.ok) throw new Error('خطا در پین کردن پیام');
    },
    [uid, chatType]
  );

  // ===== ADD REACTION =====
  const addReaction = useCallback(
    async (messageId: string, emoji: string, userId: string) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatType,
          uid,
          reaction: { emoji, userId },
        }),
      });
      if (!res.ok) throw new Error('خطا در ثبت ریاکشن');
    },
    [uid, chatType]
  );

  // ===== SEARCH =====
  const searchMessages = useCallback(
    async (query: string): Promise<Message[]> => {
      const res = await fetch(
        `/api/messages/search?chatType=${chatType}&uid=${uid}&q=${encodeURIComponent(query)}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    [uid, chatType]
  );

  // ===== CLEAR CHAT =====
  const clearChat = useCallback(async () => {
    const res = await fetch('/api/chat/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatType, uid }),
    });
    if (!res.ok) throw new Error('خطا در پاک کردن چت');
    setMessages([]);
  }, [uid, chatType]);

  return {
    messages,
    loading,
    hasMore,
    pinnedMessages,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePin,
    addReaction,
    searchMessages,
    clearChat,
  };
}
