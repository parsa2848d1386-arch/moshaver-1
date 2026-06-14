'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Message, ChatType, ToneScore } from '@/types';
import { MOODS } from '@/constants';
import { getCharCounterClass } from '@/utils/format';
import TextareaAutosize from 'react-textarea-autosize';
import ToneAnalysis from '@/components/chat/ToneAnalysis';
import { Smile, Mic, Image as ImageIcon, Send, X } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, mood: string) => void;
  disabled: boolean;
  replyTo: Message['replyTo'] | null;
  onCancelReply: () => void;
  onVoiceSend: () => void;
  onImageSend: () => void;
  chatType: ChatType;
  toneWarning: ToneScore | null;
  onAnalyzeTone: (text: string) => void;
  onNvcTranslate: (text: string) => void;
  onTyping: () => void;
}

export default function ChatInput({
  onSend,
  disabled,
  replyTo,
  onCancelReply,
  onVoiceSend,
  onImageSend,
  chatType,
  toneWarning,
  onAnalyzeTone,
  onNvcTranslate,
  onTyping,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showMoods, setShowMoods] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, selectedMood);
    setText('');
    setSelectedMood('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [text, selectedMood, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setText(val);

      // Typing indicator
      onTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        // Analyze tone when user stops typing
        if (val.trim().length > 20) {
          onAnalyzeTone(val);
        }
      }, 1000);
    },
    [onTyping, onAnalyzeTone],
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleUseNvc = useCallback(() => {
    if (toneWarning?.nvcVersion) {
      setText(toneWarning.nvcVersion);
    } else {
      onNvcTranslate(text);
    }
  }, [toneWarning, text, onNvcTranslate]);

  return (
    <div>
      {/* Tone Analysis Warning */}
      {toneWarning && toneWarning.level !== 'safe' && (
        <ToneAnalysis
          toneScore={toneWarning}
          onDismiss={() => {}}
          onUseNvc={handleUseNvc}
        />
      )}

      {/* Reply preview */}
      {replyTo && (
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--card-bg)',
            borderTop: '1px solid var(--divider)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              ↩ پاسخ به {replyTo.senderName}:
            </span>{' '}
            {replyTo.text.slice(0, 60)}
          </div>
          <button
            onClick={onCancelReply}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mood selector row */}
      {showMoods && (
        <div
          style={{
            padding: '6px 16px',
            borderTop: '1px solid var(--divider)',
            background: 'var(--header-bg)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {MOODS.map((mood) => (
            <button
              key={mood.label}
              onClick={() => {
                setSelectedMood(selectedMood === mood.value ? '' : mood.value);
              }}
              style={{
                background:
                  selectedMood === mood.value
                    ? 'var(--primary-glow)'
                    : 'var(--input-bg)',
                border:
                  selectedMood === mood.value
                    ? '1.5px solid var(--primary-color)'
                    : '1.5px solid var(--card-border)',
                borderRadius: 12,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                whiteSpace: 'nowrap',
                color: 'var(--text-main)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 16 }}>{mood.emoji}</span>
              <span style={{ fontSize: 11 }}>{mood.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div className="chat-input-area">
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => setShowMoods(!showMoods)}
            title="حال و هوا"
          >
            {selectedMood
              ? MOODS.find((m) => m.value === selectedMood)?.emoji || <Smile size={20} />
              : <Smile size={20} />}
          </button>
          <button
            className="btn btn-icon btn-secondary"
            onClick={onVoiceSend}
            title="ضبط صدا"
          >
            <Mic size={20} />
          </button>
          <button
            className="btn btn-icon btn-secondary"
            onClick={onImageSend}
            title="ارسال تصویر"
          >
            <ImageIcon size={20} />
          </button>
        </div>

        {/* Textarea */}
        <div style={{ flex: 1, position: 'relative' }}>
          <TextareaAutosize
            ref={inputRef}
            className="input-field"
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              chatType === 'shared'
                ? 'پیامتو بنویس...'
                : 'پیام خصوصی به مشاور...'
            }
            minRows={1}
            maxRows={5}
            disabled={disabled}
            style={{
              resize: 'none',
              paddingLeft: 44,
              borderRadius: 16,
              overflow: 'hidden'
            }}
          />
          {/* Character counter */}
          {text.length > 0 && (
            <span
              className={getCharCounterClass(text.length)}
              style={{
                position: 'absolute',
                bottom: 4,
                left: 8,
                fontSize: 10,
              }}
            >
              {text.length}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          className="btn btn-icon btn-primary"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          style={{
            borderRadius: 14,
            transform: text.trim() ? 'scale(1)' : 'scale(0.9)',
            opacity: text.trim() ? 1 : 0.5,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={18} style={{ transform: 'rotate(-90deg)', marginRight: 2 }} />
        </button>
      </div>
    </div>
  );
}
