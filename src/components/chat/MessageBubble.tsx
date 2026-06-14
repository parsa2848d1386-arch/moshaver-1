'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@/types';
import { REACTION_EMOJIS } from '@/constants';
import { formatRelativeTime } from '@/utils/format';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { Copy, Reply, Pin, Smile, Tag, Search, Edit2, Trash2, MoreHorizontal, Mail, RefreshCw } from 'lucide-react';

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
  const [activeContextMenu, setActiveContextMenu] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const isOwn = message.senderId === currentUserId;
  const isAi = message.senderRole === 'ai' || message.senderRole === 'counselor' || message.senderId === 'ai';
  
  const isParsa = message.senderRole === 'parsa' || message.senderName === 'پارسا';
  const isMelika = message.senderRole === 'melika' || message.senderName === 'ملیکا';

  const ownBubbleClass = isParsa
    ? 'bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/10 rounded-3xl rounded-tr-sm border border-indigo-500/10'
    : isMelika
      ? 'bg-gradient-to-br from-rose-600 to-pink-500 text-white shadow-lg shadow-rose-500/10 rounded-3xl rounded-tr-sm border border-rose-500/10'
      : 'bg-zinc-800/80 backdrop-blur-md text-zinc-100 border border-white/5 rounded-3xl rounded-tr-sm';

  const partnerBubbleClass = isParsa
    ? 'bg-gradient-to-br from-indigo-500/15 to-blue-500/5 text-zinc-100 rounded-3xl rounded-tl-sm border border-indigo-500/15 shadow-[inset_0_0_12px_rgba(99,102,241,0.05)]'
    : isMelika
      ? 'bg-gradient-to-br from-rose-600/15 to-pink-500/5 text-zinc-100 rounded-3xl rounded-tl-sm border border-rose-500/15 shadow-[inset_0_0_12px_rgba(236,72,153,0.05)]'
      : 'bg-zinc-900/60 backdrop-blur-md text-zinc-200 border border-white/5 rounded-3xl rounded-tl-sm';

  if (message.isDeleted) {
    return (
      <div className={`flex flex-col w-full ${isOwn ? 'items-start' : 'items-end'}`} dir="rtl">
        <div className="bg-zinc-800/40 px-5 py-3 rounded-2xl text-zinc-500 italic text-sm border border-white/5">
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col w-full ${isOwn ? 'items-start' : 'items-end'} mb-4 group`}
      dir="rtl"
    >
      {!isOwn && !isAi && (
        <span className="text-zinc-500 text-xs mb-1 mr-12">{message.senderName}</span>
      )}

      {/* Reply indicator */}
      {message.replyTo && (
        <div className="mb-2 bg-zinc-900/60 backdrop-blur-md rounded-xl p-2 px-4 border border-white/5 flex items-center text-sm text-zinc-400 max-w-[80%]">
          <span className="text-blue-400 font-semibold ml-2">↩ پاسخ به {message.replyTo.senderName}:</span>
          <span className="truncate">{message.replyTo.text}</span>
        </div>
      )}

      {/* Tone Warning */}
      {message.toneScore && message.toneScore.level !== 'safe' && (
        <div className={`text-xs px-3 py-1.5 rounded-lg mb-2 ${message.toneScore.level === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
          ⚠️ {message.toneScore.suggestion || 'لحن این پیام ممکن است تند باشد'}
        </div>
      )}

      {/* Memory Tag */}
      {message.memoryTag && (
        <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
          🏷️ {message.memoryTag}
        </div>
      )}

      {/* User Message */}
      {isOwn ? (
        <div className="flex flex-col items-start relative max-w-[85%]">
          <div className={`${ownBubbleClass} px-5 py-3.5 leading-relaxed`}>
            {/* Image display */}
            {message.imageUrl && (
              <div className="mb-3 rounded-2xl overflow-hidden">
                <Zoom>
                  <img src={message.imageUrl} alt="پیوست" className="w-full max-h-60 object-cover rounded-2xl" />
                </Zoom>
              </div>
            )}
            {/* Voice Message */}
            {message.voiceUrl && (
              <div className="flex items-center gap-3 mb-2 bg-zinc-900/50 p-2 rounded-2xl">
                <button onClick={handleVoicePlay} className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  {voicePlaying ? '⏸' : '▶️'}
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className={`w-1 rounded-full transition-all ${voicePlaying ? 'bg-blue-400' : 'bg-zinc-600'}`} style={{ height: 4 + Math.random() * 16 }} />
                  ))}
                </div>
              </div>
            )}
            {message.text && <MarkdownRenderer text={message.text} />}
          </div>
          
          <div className="flex items-center gap-2 mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-zinc-500">{formatRelativeTime(message.createdAt)}</span>
            {message.isEdited && <span className="text-[10px] text-zinc-500">(ویرایش شده)</span>}
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(message)} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"><Edit2 size={12} /></button>
              <button onClick={() => onDelete(message)} className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-colors"><Trash2 size={12} /></button>
              <button onClick={() => onReply(message)} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"><Reply size={12} /></button>
            </div>
          </div>
        </div>
      ) : (
        /* AI / Partner Message */
        <div className="flex gap-4 w-full">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isAi ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : isParsa ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
            {isAi ? <SparkleIcon size={16} /> : message.senderName?.charAt(0)}
          </div>
          
          <div className="flex-1 max-w-[90%]">
            <div className={`prose prose-invert prose-zinc max-w-none leading-8 prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 ${isAi ? 'bg-zinc-900/30 border border-white/5 backdrop-blur-md px-5 py-3.5 rounded-3xl rounded-tl-sm text-zinc-200' : `${partnerBubbleClass} px-5 py-3.5`}`}>
              {/* Image display */}
              {message.imageUrl && (
                <div className="mb-3 rounded-2xl overflow-hidden">
                  <Zoom>
                    <img src={message.imageUrl} alt="پیوست" className="w-full max-h-60 object-cover rounded-2xl" />
                  </Zoom>
                </div>
              )}
              {message.text && <MarkdownRenderer text={message.text} />}
            </div>

            {/* AI / Partner Action Row */}
            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setShowReactions(!showReactions)} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors" title="واکنش">
                <Smile size={16} />
              </button>
              <button onClick={() => onTagMemory(message)} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors" title="ثبت خاطره">
                <Tag size={16} />
              </button>
              <button onClick={() => onPerspective(message)} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors" title="تحلیل دیدگاه">
                <Search size={16} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setActiveContextMenu(!activeContextMenu)}
                  className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
                
                <AnimatePresence>
                  {activeContextMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute bottom-full mb-2 right-0 w-48 bg-zinc-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden py-1 z-50"
                    >
                      <button onClick={() => { onCopy(message.text); setActiveContextMenu(false); }} className="w-full text-right px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3">
                        <Copy size={16} /> کپی کردن
                      </button>
                      <button onClick={() => { onReply(message); setActiveContextMenu(false); }} className="w-full text-right px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3">
                        <Reply size={16} /> پاسخ
                      </button>
                      <button onClick={() => { onPin(message); setActiveContextMenu(false); }} className="w-full text-right px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3">
                        <Pin size={16} fill={message.isPinned ? "currentColor" : "none"} /> {message.isPinned ? 'برداشتن پین' : 'پین کردن'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[10px] text-zinc-600 mr-auto">{formatRelativeTime(message.createdAt)}</span>
            </div>

            {/* Reactions display */}
            {totalReactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {totalReactions.map(([emoji, users]) => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(message, emoji)}
                    className="bg-zinc-800/50 border border-white/5 rounded-full px-2 py-1 text-xs flex items-center gap-1 hover:bg-zinc-700 transition-colors"
                  >
                    <span>{emoji}</span>
                    <span className="text-zinc-400">{users.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Reaction picker */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex gap-2 mt-2 bg-zinc-800 border border-white/10 rounded-full px-3 py-1.5 shadow-xl w-max"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { onReaction(message, emoji); setShowReactions(false); }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </div>
      )}
      
      {/* Click outside context menu */}
      {activeContextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveContextMenu(false)} />
      )}
    </motion.div>
  );
}

function SparkleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.5 0C11.5 5.5 16 10 21.5 10C16 10 11.5 14.5 11.5 20C11.5 14.5 7 10 1.5 10C7 10 11.5 5.5 11.5 0Z" fill="currentColor"/>
    </svg>
  );
}
