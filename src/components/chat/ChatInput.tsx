'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, AudioLines, StopCircle, X, Smile, Image as ImageIcon, Camera, Brain } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import type { Message, ChatType, ToneScore } from '@/types';
import ToneAnalysis from '@/components/chat/ToneAnalysis';
import { MOODS } from '@/constants';

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
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const micPulseVariants = {
    recording: { scale: [1, 1.2, 1], opacity: [1, 0.8, 1], transition: { repeat: Infinity, duration: 1.5 } },
    idle: { scale: 1, opacity: 1 },
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, selectedMood);
    setText('');
    setSelectedMood('');
  }, [text, selectedMood, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onTyping();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (val.trim().length > 20) {
        onAnalyzeTone(val);
      }
    }, 1000);
  }, [onTyping, onAnalyzeTone]);

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
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-6 pt-2" dir="rtl">
      
      {/* Tone Analysis Warning */}
      {toneWarning && toneWarning.level !== 'safe' && (
        <div className="mb-4">
          <ToneAnalysis toneScore={toneWarning} onDismiss={() => {}} onUseNvc={handleUseNvc} />
        </div>
      )}

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="mb-2 bg-zinc-900/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex justify-between items-center text-sm text-zinc-300"
          >
            <div className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 ml-4">
              <span className="text-blue-400 font-semibold ml-2">↩ پاسخ به {replyTo.senderName}:</span>
              {replyTo.text.slice(0, 60)}
            </div>
            <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          boxShadow: isFocused ? '0 8px 32px rgba(59, 130, 246, 0.15)' : '0 4px 12px rgba(0,0,0,0.2)',
          borderColor: isFocused ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'
        }}
        className="flex items-end gap-2 bg-zinc-900/80 backdrop-blur-2xl border rounded-[32px] p-2 pl-3 transition-colors"
      >
        <button
          onClick={() => setShowBottomSheet(true)}
          className="flex-shrink-0 w-10 h-10 mb-1 mr-1 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors border border-white/5"
        >
          <Plus size={20} />
        </button>

        <div className="flex-1 relative mb-1">
          <TextareaAutosize
            ref={inputRef}
            value={text}
            onChange={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={chatType === 'shared' ? 'پیام خود را بنویسید...' : 'پیام خصوصی...'}
            className="w-full bg-transparent border-none focus:outline-none text-zinc-100 placeholder:text-zinc-500 resize-none px-2 py-2 text-base font-medium max-h-[150px] scrollbar-hide leading-relaxed"
            minRows={1}
            disabled={disabled}
            dir="auto"
          />
        </div>

        <div className="flex items-center gap-1 mb-1 ml-1">
          <AnimatePresence mode="popLayout">
            {text.trim() ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleSend} disabled={disabled}
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
              >
                <motion.div animate={{ rotate: disabled ? 360 : 0 }} transition={{ repeat: disabled ? Infinity : 0, duration: 2, ease: 'linear' }}>
                  <SparkleIcon size={18} />
                </motion.div>
              </motion.button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                {isRecording ? (
                  <motion.button
                    variants={micPulseVariants} animate="recording"
                    onClick={() => { setIsRecording(false); onVoiceSend(); }}
                    className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"
                  >
                    <StopCircle size={20} />
                  </motion.button>
                ) : (
                  <>
                    <button onClick={() => setIsRecording(true)} className="w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 flex items-center justify-center transition-colors">
                      <Mic size={20} />
                    </button>
                    <button onClick={onImageSend} className="w-10 h-10 rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                      <ImageIcon size={20} />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom Sheet for Attachments & Mood */}
      <AnimatePresence>
        {showBottomSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBottomSheet(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl border-t border-white/10 z-50 flex flex-col max-h-[85vh] shadow-2xl"
            >
              <div className="w-full flex justify-center py-3" onClick={() => setShowBottomSheet(false)}>
                <div className="w-12 h-1.5 rounded-full bg-zinc-700 cursor-pointer" />
              </div>

              <div className="p-4 flex flex-col gap-6 overflow-y-auto">
                <div>
                  <h3 className="text-sm text-zinc-400 mb-3 font-medium">حال و هوای شما</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {MOODS.map(mood => (
                      <button
                        key={mood.label}
                        onClick={() => setSelectedMood(selectedMood === mood.value ? '' : mood.value)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-colors whitespace-nowrap text-sm font-medium ${
                          selectedMood === mood.value ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-800 border-white/5 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        <span className="text-lg">{mood.emoji}</span>
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => { onImageSend(); setShowBottomSheet(false); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-left">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <ImageIcon size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-medium">ارسال عکس</span>
                      <span className="text-zinc-500 text-sm">انتخاب عکس از گالری</span>
                    </div>
                  </button>
                  <button onClick={() => { onVoiceSend(); setShowBottomSheet(false); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-left">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Mic size={20} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-zinc-200 font-medium">ارسال صدای ضبط شده</span>
                      <span className="text-zinc-500 text-sm">پیام صوتی خود را ضبط کنید</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SparkleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.5 0C11.5 5.5 16 10 21.5 10C16 10 11.5 14.5 11.5 20C11.5 14.5 7 10 1.5 10C7 10 11.5 5.5 11.5 0Z" fill="currentColor"/>
    </svg>
  );
}
