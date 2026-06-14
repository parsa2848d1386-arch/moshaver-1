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
      <div className="chat-messages">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <p className="empty-state-text">
            هنوز پیامی نیست!
            <br />
            اولین پیام رو بفرست و گفتگو رو شروع کن 💜
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-messages" ref={containerRef} onScroll={handleScroll}>
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

      {/* AI typing indicator */}
      {aiTyping && (
        <div className="message-wrapper ai" style={{ opacity: 0.9 }}>
          <span className="message-sender">🤖 مشاور هوشمند</span>
          <div className="message-bubble" style={{ display: 'flex', gap: 6, padding: '14px 20px' }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      {/* Partner typing indicator */}
      {partnerTyping && (
        <div className="message-wrapper ai" style={{ opacity: 0.7 }}>
          <div className="message-bubble" style={{ display: 'flex', gap: 6, padding: '14px 20px', fontSize: 12 }}>
            در حال تایپ
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button className="scroll-to-bottom" onClick={scrollToBottom}>
          ⬇
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: 'var(--danger-color)',
              color: 'white',
              fontSize: 11,
              fontWeight: 'bold',
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              animation: 'bounceIn 0.3s ease'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
