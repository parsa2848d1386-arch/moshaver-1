'use client';

import { useState } from 'react';
import type { Message } from '@/types';
import { REACTION_EMOJIS } from '@/constants';
import { formatRelativeTime } from '@/utils/format';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { Copy, Reply, Pin, Smile, Tag, Search, Edit2, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  onCopy: (text: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onPin: (message: Message) => void;
  onReaction: (message: Message, emoji: string) => void;
  onTagMemory: (message: Message) => void;
  onPerspective: (message: Message) => void;
}

export default function MessageBubble({
  message,
  currentUserId,
  onCopy,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReaction,
  onTagMemory,
  onPerspective,
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const isOwn = message.senderId === currentUserId;
  const isAi = message.senderRole === 'ai';
  const wrapperClass = isAi ? 'ai' : isOwn ? `user ${message.senderRole}` : `user ${message.senderRole}`;

  if (message.isDeleted) {
    return (
      <div className={`message-wrapper ${wrapperClass}`}>
        <div
          className="message-bubble"
          style={{ opacity: 0.5, fontStyle: 'italic', fontSize: 13 }}
        >
          🗑️ این پیام حذف شده است
        </div>
      </div>
    );
  }

  const handleVoicePlay = () => {
    if (!message.voiceUrl) return;
    const audio = new Audio(message.voiceUrl);
    setVoicePlaying(true);
    audio.play();
    audio.onended = () => setVoicePlaying(false);
  };

  const totalReactions = message.reactions
    ? Object.entries(message.reactions).filter(([, users]) => users.length > 0)
    : [];

  return (
    <div className={`message-wrapper ${wrapperClass}`}>
      {/* Sender name */}
      {!isOwn && (
        <span className="message-sender">{message.senderName}</span>
      )}

      {/* Reply indicator */}
      {message.replyTo && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 12,
            padding: '6px 12px',
            marginBottom: 4,
            fontSize: 12,
            color: 'var(--text-muted)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
            ↩ {message.replyTo.senderName}:
          </span>{' '}
          {message.replyTo.text.slice(0, 60)}
          {message.replyTo.text.length > 60 ? '...' : ''}
        </div>
      )}

      {/* Tone warning */}
      {message.toneScore && message.toneScore.level !== 'safe' && (
        <div
          style={{
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 8,
            marginBottom: 4,
            background:
              message.toneScore.level === 'danger'
                ? 'var(--danger-bg)'
                : 'var(--warning-bg)',
            color:
              message.toneScore.level === 'danger'
                ? 'var(--danger-color)'
                : 'var(--warning-color)',
          }}
        >
          ⚠️ {message.toneScore.suggestion || 'لحن این پیام ممکنه آزاردهنده باشه'}
        </div>
      )}

      {/* Memory tag indicator */}
      {message.memoryTag && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--warning-color)',
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          🏷️ {message.memoryTag}
        </div>
      )}

      {/* Message bubble */}
      <div className="message-bubble">
        {/* Image display */}
        {message.imageUrl && (
          <div style={{ marginBottom: 8, borderRadius: 12, overflow: 'hidden' }}>
            <Zoom>
              <img
                src={message.imageUrl}
                alt="تصویر پیوست"
                style={{
                  width: '100%',
                  maxHeight: 250,
                  objectFit: 'cover',
                  borderRadius: 12,
                }}
              />
            </Zoom>
          </div>
        )}

        {/* Voice message player */}
        {message.voiceUrl && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: message.text ? 8 : 0,
              padding: '6px 0',
            }}
          >
            <button
              onClick={handleVoicePlay}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--primary-glow)',
                border: '1px solid var(--primary-color)',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {voicePlaying ? '⏸' : '▶️'}
            </button>
            {/* Simple waveform bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: 4 + Math.random() * 18,
                    borderRadius: 2,
                    background: voicePlaying
                      ? 'var(--primary-color)'
                      : 'var(--text-muted)',
                    opacity: voicePlaying ? 1 : 0.4,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
            {message.voiceDuration && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'ltr' }}>
                {Math.floor(message.voiceDuration / 60)}:
                {String(message.voiceDuration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        )}

        {/* Text content */}
        {message.text && <MarkdownRenderer text={message.text} />}

        {/* Edited badge */}
        {message.isEdited && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              marginRight: 6,
              opacity: 0.7,
            }}
          >
            (ویرایش شده)
          </span>
        )}

        {/* Pinned badge */}
        {message.isPinned && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--warning-color)',
              marginRight: 6,
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <Pin size={12} fill="currentColor" />
          </span>
        )}

        {/* Actions */}
        <div className="message-actions" style={{ display: 'flex', gap: 4, padding: '4px' }}>
          <button className="copy-btn" onClick={() => onCopy(message.text)} title="کپی">
            <Copy size={14} />
          </button>
          <button className="copy-btn" onClick={() => onReply(message)} title="پاسخ">
            <Reply size={14} />
          </button>
          <button
            className="copy-btn"
            onClick={() => onPin(message)}
            title={message.isPinned ? 'برداشتن پین' : 'پین'}
          >
            <Pin size={14} fill={message.isPinned ? "currentColor" : "none"} />
          </button>
          <button
            className="copy-btn"
            onClick={() => setShowReactions(!showReactions)}
            title="واکنش"
          >
            <Smile size={14} />
          </button>
          <button
            className="copy-btn"
            onClick={() => onTagMemory(message)}
            title="ثبت خاطره"
          >
            <Tag size={14} />
          </button>
          <button
            className="copy-btn"
            onClick={() => onPerspective(message)}
            title="تحلیل دیدگاه"
          >
            <Search size={14} />
          </button>
          {isOwn && (
            <>
              <button
                className="copy-btn"
                onClick={() => onEdit(message)}
                title="ویرایش"
              >
                <Edit2 size={14} />
              </button>
              <button
                className="copy-btn"
                onClick={() => onDelete(message)}
                title="حذف"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reactions display */}
      {totalReactions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginTop: 4,
            flexWrap: 'wrap',
          }}
        >
          {totalReactions.map(([emoji, users]) => (
            <button
              key={emoji}
              onClick={() => onReaction(message, emoji)}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: '2px 8px',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{emoji}</span>
              <span style={{ fontSize: 11 }}>{users.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Reaction picker */}
      {showReactions && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginTop: 4,
            background: 'var(--card-bg-solid)',
            border: '1px solid var(--card-border)',
            borderRadius: 14,
            padding: '6px 10px',
            animation: 'bounceIn 0.3s ease',
          }}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReaction(message, emoji);
                setShowReactions(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                padding: 2,
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.transform = 'scale(1.3)')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.transform = 'scale(1)')
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Time & Status */}
      <span className="message-time" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {formatRelativeTime(message.createdAt)}
        {isOwn && message.status === 'sending' && (
          <span style={{ fontSize: 10, opacity: 0.6 }}>🕒</span>
        )}
        {isOwn && (message.status === 'sent' || !message.status) && (
          <span style={{ fontSize: 10, opacity: 0.8, color: 'var(--primary-color)' }}>✓</span>
        )}
        {isOwn && message.status === 'error' && (
          <span style={{ fontSize: 10, color: 'var(--danger-color)' }}>❌</span>
        )}
      </span>
    </div>
  );
}
