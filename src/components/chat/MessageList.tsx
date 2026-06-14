'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Message, ChatType } from '@/types';
import { formatPersianDate } from '@/utils/format';
import MessageBubble from '@/components/chat/MessageBubble';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  pinnedMessages: Message[];
  currentUserId: string;
  chatType: ChatType;
  aiTyping: boolean;
  partnerTyping: boolean;
  onCopy: (text: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onPin: (message: Message) => void;
  onReaction: (message: Message, emoji: string) => void;
  onTagMemory: (message: Message) => void;
  onPerspective: (message: Message) => void;
}

function getDateKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return '';
  }
}

export default function MessageList({
  messages,
  loading,
  hasMore,
  onLoadMore,
  pinnedMessages,
  currentUserId,
  aiTyping,
  partnerTyping,
  onCopy,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReaction,
  onTagMemory,
  onPerspective,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setUnreadCount(0);
      setShowScrollBtn(false);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // If new messages arrived
    if (messages.length > prevMessagesLength.current) {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // If user is not at the bottom, increment unread count instead of auto-scrolling
      if (distFromBottom > 200) {
        setUnreadCount(prev => prev + (messages.length - prevMessagesLength.current));
      } else {
        // If near bottom, scroll automatically
        setTimeout(scrollToBottom, 50);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Infinite scroll: load more when near top
    if (el.scrollTop < 80 && hasMore && !loading) {
      onLoadMore();
    }

    // Show scroll-to-bottom button when scrolled up
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isScrolledUp = distFromBottom > 200;
    setShowScrollBtn(isScrolledUp);
    
    // Clear unread count when user reaches bottom
    if (!isScrolledUp) {
      setUnreadCount(0);
    }
  }, [hasMore, loading, onLoadMore]);

  // Group messages by date for separators
  const messagesWithDates = useMemo(() => {
    const result: { type: 'date' | 'message'; date?: string; message?: Message }[] = [];
    let lastDateKey = '';

    for (const msg of messages) {
      const key = getDateKey(msg.createdAt);
      if (key !== lastDateKey) {
        result.push({ type: 'date', date: msg.createdAt });
        lastDateKey = key;
      }
      result.push({ type: 'message', message: msg });
    }

    return result;
  }, [messages]);

  // Virtualizer for performance
  const virtualizer = useVirtualizer({
    count: messagesWithDates.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80, // Approximate height of a message bubble
  });

  // Empty state
  if (!loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl">
          <div className="text-4xl">💭</div>
          <p className="text-zinc-400 text-sm text-center leading-loose">
            اولین پیام خود را ارسال کنید و<br />
            گفتگوی جدیدی را آغاز نمایید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative min-h-0" ref={containerRef} onScroll={handleScroll}>
      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && (
        <div
          style={{
            background: 'var(--warning-bg)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: 14,
            padding: '8px 14px',
            marginBottom: 8,
            cursor: 'pointer',
          }}
          onClick={() => setShowPinned(!showPinned)}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--warning-color)',
            }}
          >
            <span>📌 {pinnedMessages.length} پیام پین شده</span>
            <span style={{ fontSize: 11 }}>{showPinned ? '▲' : '▼'}</span>
          </div>
          {showPinned && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pinnedMessages.map((pm) => (
                <div
                  key={pm.id}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    padding: '4px 8px',
                    background: 'var(--card-bg)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{pm.senderName}:</span>{' '}
                  {pm.text.slice(0, 80)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="shimmer"
              style={{
                height: 48,
                borderRadius: 16,
                width: i % 2 === 0 ? '65%' : '50%',
                alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
              }}
            />
          ))}
        </div>
      )}

      {/* Has more indicator */}
      {hasMore && !loading && (
        <div
          style={{
            textAlign: 'center',
            padding: 8,
            fontSize: 12,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          onClick={onLoadMore}
        >
          ⬆️ بارگذاری پیام‌های قبلی
        </div>
      )}

      {/* Virtualized Messages */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = messagesWithDates[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                padding: '4px 0',
              }}
            >
              {item.type === 'date' && item.date ? (
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 10,
                      padding: '4px 14px',
                    }}
                  >
                    {formatPersianDate(item.date)}
                  </span>
                </div>
              ) : item.type === 'message' && item.message ? (
                <MessageBubble
                  message={item.message}
                  currentUserId={currentUserId}
                  onCopy={onCopy}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPin={onPin}
                  onReaction={onReaction}
                  onTagMemory={onTagMemory}
                  onPerspective={onPerspective}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Partner typing indicator */}
      {partnerTyping && (
        <div className="flex items-center gap-2 text-zinc-500 text-xs mb-4 ml-4 px-4">
          در حال تایپ...
        </div>
      )}

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button 
          className="absolute bottom-4 right-4 w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110 z-50" 
          onClick={scrollToBottom}
        >
          ⬇
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shadow-lg border border-zinc-900">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
