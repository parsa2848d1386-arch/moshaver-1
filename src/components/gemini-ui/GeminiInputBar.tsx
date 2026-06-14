'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, AudioLines, StopCircle } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

interface GeminiInputBarProps {
  onSendMessage: (text: string) => void;
  onOpenBottomSheet: () => void;
  isGenerating: boolean;
}

export default function GeminiInputBar({ onSendMessage, onOpenBottomSheet, isGenerating }: GeminiInputBarProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-pulse animation for mic when recording
  const micPulseVariants = {
    recording: { scale: [1, 1.2, 1], opacity: [1, 0.8, 1], transition: { repeat: Infinity, duration: 1.5 } },
    idle: { scale: 1, opacity: 1 },
  };

  const handleSend = () => {
    if (text.trim() && !isGenerating) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <motion.div
        animate={{
          boxShadow: isFocused ? '0 8px 32px rgba(59, 130, 246, 0.15)' : '0 4px 12px rgba(0,0,0,0.2)',
          borderColor: isFocused ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'
        }}
        className="flex items-end gap-2 bg-zinc-900/80 backdrop-blur-2xl border rounded-[32px] p-2 pl-3 transition-colors"
      >
        {/* Plus Button */}
        <button
          onClick={onOpenBottomSheet}
          className="flex-shrink-0 w-10 h-10 mb-1 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors border border-white/5"
        >
          <Plus size={20} />
        </button>

        {/* Text Area */}
        <div className="flex-1 relative mb-1">
          <TextareaAutosize
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gemini"
            className="w-full bg-transparent border-none focus:outline-none text-zinc-100 placeholder:text-zinc-500 resize-none px-2 py-2 text-base font-medium max-h-[150px] scrollbar-hide leading-relaxed"
            minRows={1}
            dir="auto"
            disabled={isGenerating}
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1 mb-1 mr-1">
          <AnimatePresence mode="popLayout">
            {text.trim() ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleSend}
                disabled={isGenerating}
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
              >
                <motion.div
                  animate={{ rotate: isGenerating ? 360 : 0 }}
                  transition={{ repeat: isGenerating ? Infinity : 0, duration: 2, ease: 'linear' }}
                >
                  <SparkleIcon size={18} />
                </motion.div>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center"
              >
                {isRecording ? (
                  <motion.button
                    variants={micPulseVariants}
                    animate="recording"
                    onClick={() => setIsRecording(false)}
                    className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"
                  >
                    <StopCircle size={20} />
                  </motion.button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsRecording(true)}
                      className="w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 flex items-center justify-center transition-colors"
                    >
                      <Mic size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                      <AudioLines size={20} />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Custom Sparkle Icon for send button to mimic Gemini
function SparkleIcon({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11.5 0C11.5 5.5 16 10 21.5 10C16 10 11.5 14.5 11.5 20C11.5 14.5 7 10 1.5 10C7 10 11.5 5.5 11.5 0Z" fill="currentColor"/>
    </svg>
  );
}
