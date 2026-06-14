'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, MoreHorizontal, Copy, RefreshCw, ThumbsUp, ThumbsDown, Share2, Mail, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GeminiModelSelector from './GeminiModelSelector';
import GeminiInputBar from './GeminiInputBar';
import GeminiBottomSheet from './GeminiBottomSheet';
import GeminiSidebar from './GeminiSidebar';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export default function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'ai', text: 'سلام! پارسا جان، چطور می‌تونم کمکت کنم؟' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('flash');
  const [thinkingLevel, setThinkingLevel] = useState<'standard'|'extended'>('standard');
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);

  const handleSendMessage = (text: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setIsGenerating(true);

    // Mock API call
    setTimeout(() => {
      const aiResponse = "این یک **پاسخ تستی** است که با الهام از رابط کاربری جدید *Gemini* شبیه‌سازی شده است.\n\n- پویایی بک‌گراند\n- انیمیشن‌های فلوئید\n- مدال‌های حرفه‌ای";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: aiResponse }]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="relative w-full h-screen bg-[#09090B] text-zinc-100 overflow-hidden font-sans" dir="rtl">
      
      {/* Background Aura (Fluid Glowing Gradient) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            opacity: isGenerating ? 0.4 : 0.1,
            scale: isGenerating ? [1, 1.1, 1] : 1,
            rotate: isGenerating ? [0, 5, -5, 0] : 0,
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent mix-blend-screen"
        />
        <motion.div
          animate={{
            opacity: isGenerating ? 0.3 : 0,
            scale: isGenerating ? [1, 1.2, 1] : 0.8,
            x: isGenerating ? [0, 50, 0] : 0,
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px] bg-gradient-to-bl from-emerald-500/30 via-teal-400/20 to-transparent mix-blend-screen"
        />
        <motion.div
          animate={{
            opacity: isGenerating ? 0.2 : 0,
            y: isGenerating ? [0, -30, 0] : 0,
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 left-[20%] w-[80vw] h-[50vw] rounded-full blur-[120px] bg-gradient-to-t from-amber-500/20 to-orange-500/10 mix-blend-screen"
        />
      </div>

      {/* Header */}
      <header className="absolute top-0 w-full p-4 flex justify-between items-center z-30">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-300"
        >
          <Menu size={24} />
        </button>

        <GeminiModelSelector 
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          thinkingLevel={thinkingLevel}
          onSelectThinkingLevel={setThinkingLevel}
        />

        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity">
          P
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="absolute inset-0 pt-20 pb-28 overflow-y-auto px-4 sm:px-8 scrollbar-hide z-20 flex flex-col">
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 flex-1 justify-end">
          
          {messages.length === 1 && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center mb-20 opacity-80">
              <SparkleLogo />
              <h1 className="text-2xl font-medium mt-6 text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
                چطور می‌تونم امروز کمکت کنم؟
              </h1>
            </div>
          )}

          {messages.map((msg, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="bg-zinc-800/80 backdrop-blur-md px-5 py-3.5 rounded-3xl rounded-tr-sm max-w-[85%] text-zinc-100 leading-relaxed border border-white/5">
                  {msg.text}
                </div>
              ) : (
                <div className="flex gap-4 w-full group">
                  {index > 0 && (
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <SparkleIcon size={16} />
                    </div>
                  )}
                  <div className="flex-1 max-w-[90%]">
                    <div className="prose prose-invert prose-zinc max-w-none text-zinc-200 leading-8 prose-p:my-2 prose-ul:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                    
                    {/* Action Row */}
                    {index > 0 && (
                      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors">
                          <ThumbsUp size={16} />
                        </button>
                        <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors">
                          <ThumbsDown size={16} />
                        </button>
                        <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors">
                          <Share2 size={16} />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => setActiveContextMenu(activeContextMenu === msg.id ? null : msg.id)}
                            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {/* Context Menu Dropdown */}
                          <AnimatePresence>
                            {activeContextMenu === msg.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute bottom-full mb-2 right-0 w-48 bg-zinc-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden py-1 z-50"
                              >
                                <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3">
                                  <Copy size={16} /> کپی کردن
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3">
                                  <RefreshCw size={16} /> پاسخ مجدد
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                                <button className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3">
                                  <Mail size={16} /> ارسال به جیمیل
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-3">
                                  <Trash2 size={16} /> حذف
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex gap-4 items-center mt-2 w-full"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <SparkleIcon size={16} />
                </motion.div>
              </div>
              <div className="flex gap-1.5">
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-blue-400" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-purple-400" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#09090B] via-[#09090B]/80 to-transparent pt-10 z-30">
        <GeminiInputBar 
          onSendMessage={handleSendMessage} 
          onOpenBottomSheet={() => setBottomSheetOpen(true)}
          isGenerating={isGenerating}
        />
      </div>

      {/* Overlay Modals */}
      <GeminiBottomSheet isOpen={bottomSheetOpen} onClose={() => setBottomSheetOpen(false)} />
      <GeminiSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => setMessages([{ id: 'welcome', role: 'ai', text: 'سلام! پارسا جان، چطور می‌تونم کمکت کنم؟' }])} />
      
      {/* Click outside context menu */}
      {activeContextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveContextMenu(null)} />
      )}
    </div>
  );
}

function SparkleLogo() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-xl"
      />
      <SparkleIcon size={48} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
    </div>
  );
}

function SparkleIcon({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11.5 0C11.5 5.5 16 10 21.5 10C16 10 11.5 14.5 11.5 20C11.5 14.5 7 10 1.5 10C7 10 11.5 5.5 11.5 0Z" fill="currentColor"/>
    </svg>
  );
}
