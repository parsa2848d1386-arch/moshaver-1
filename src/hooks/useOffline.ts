'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '@/types';

const PENDING_MESSAGES_KEY = 'moshaver-pending-messages';
const SYNC_TAG = 'moshaver-sync-messages';

interface PendingMessage {
  id: string;
  message: Message;
  chatType: string;
  timestamp: number;
  retryCount: number;
}

interface UseOfflineReturn {
  /** Whether the user currently has internet connectivity */
  isOnline: boolean;
  /** Array of messages saved while offline, pending sync */
  pendingMessages: PendingMessage[];
  /** Manually trigger sync of all pending messages */
  syncMessages: () => Promise<void>;
  /** Add a message to the pending queue (used when offline) */
  addPendingMessage: (message: Message, chatType: string) => void;
  /** Remove a specific pending message by id */
  removePendingMessage: (id: string) => void;
  /** Number of pending messages */
  pendingCount: number;
}

/**
 * Generates a unique ID for pending messages.
 */
function generatePendingId(): string {
  return `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Read pending messages from localStorage.
 */
function loadPendingMessages(): PendingMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as PendingMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save pending messages to localStorage.
 */
function savePendingMessages(messages: PendingMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('[useOffline] Failed to save pending messages:', error);
  }
}

/**
 * Hook to track online/offline status and manage pending messages.
 *
 * When the user goes offline, messages can be queued via `addPendingMessage`.
 * When connectivity is restored, `syncMessages` is called automatically
 * (or can be triggered manually) to send all pending messages.
 */
export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>(() => {
    return loadPendingMessages();
  });

  const isSyncing = useRef(false);

  // ===== Online/Offline Event Listeners =====
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync request from service worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_PENDING_MESSAGES') {
        syncMessages();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Persist pending messages =====
  useEffect(() => {
    savePendingMessages(pendingMessages);
  }, [pendingMessages]);

  // ===== Auto-sync when coming back online =====
  useEffect(() => {
    if (isOnline && pendingMessages.length > 0) {
      syncMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // ===== Add a message to the pending queue =====
  const addPendingMessage = useCallback((message: Message, chatType: string) => {
    const pendingMsg: PendingMessage = {
      id: generatePendingId(),
      message,
      chatType,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setPendingMessages((prev) => [...prev, pendingMsg]);

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then((registration) => {
          return (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
        })
        .catch((err) => {
          console.warn('[useOffline] Background sync registration failed:', err);
        });
    }
  }, []);

  // ===== Remove a pending message =====
  const removePendingMessage = useCallback((id: string) => {
    setPendingMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  // ===== Sync all pending messages =====
  const syncMessages = useCallback(async () => {
    if (isSyncing.current) return;
    if (!navigator.onLine) return;

    const current = loadPendingMessages();
    if (current.length === 0) return;

    isSyncing.current = true;

    const failedMessages: PendingMessage[] = [];

    for (const pending of current) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: pending.message,
            chatType: pending.chatType,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn('[useOffline] Failed to sync message:', pending.id, error);
        // Keep the message for retry if under max retries
        if (pending.retryCount < 5) {
          failedMessages.push({
            ...pending,
            retryCount: pending.retryCount + 1,
          });
        } else {
          console.error('[useOffline] Max retries reached for message:', pending.id);
        }
      }
    }

    setPendingMessages(failedMessages);
    savePendingMessages(failedMessages);
    isSyncing.current = false;
  }, []);

  return {
    isOnline,
    pendingMessages,
    syncMessages,
    addPendingMessage,
    removePendingMessage,
    pendingCount: pendingMessages.length,
  };
}

export default useOffline;
