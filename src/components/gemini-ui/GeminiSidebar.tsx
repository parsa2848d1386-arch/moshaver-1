'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Search, MessageSquare, Book, Clock, Settings, User } from 'lucide-react';

interface GeminiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export default function GeminiSidebar({ isOpen, onClose, onNewChat }: GeminiSidebarProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Mock data
  const notebooks = [
    { id: 1, title: 'Ideas & Brainstorming' },
    { id: 2, title: 'Travel Plans' },
  ];
  
  const recents = [
    { id: 1, title: 'React Performance Tips', time: '2h ago' },
    { id: 2, title: 'Healthy dinner recipes', time: 'Yesterday' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] bg-zinc-950/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 flex flex-col gap-4">
                <button
                  onClick={onNewChat}
                  className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 p-3 rounded-2xl transition-colors border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium">New Chat</span>
                </button>

                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full bg-zinc-900 border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6 scrollbar-hide">
                {/* Notebooks Section */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Book size={14} /> Notebooks
                  </h3>
                  <div className="flex flex-col gap-1">
                    {notebooks.map(nb => (
                      <button key={nb.id} className="flex items-center gap-3 p-2 rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors text-sm text-left">
                        <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                        {nb.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recents Section */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Clock size={14} /> Recents
                  </h3>
                  <div className="flex flex-col gap-1">
                    {recents.map(chat => (
                      <button key={chat.id} className="flex flex-col p-2 rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors text-sm text-left">
                        <span className="truncate w-full">{chat.title}</span>
                        <span className="text-[10px] text-zinc-500">{chat.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile Section (Bottom) */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-zinc-900 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-sm font-medium text-zinc-200">Parsa</span>
                    <span className="text-xs text-zinc-500">parsa@example.com</span>
                  </div>
                  <div className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-md border border-blue-500/30">
                    <span className="text-[10px] font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">PRO</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                P
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white">Parsa</h2>
                <p className="text-zinc-400 text-sm">parsa@example.com</p>
              </div>

              <button className="w-full py-2.5 rounded-full border border-white/20 text-zinc-200 hover:bg-zinc-800 transition-colors font-medium text-sm mt-2">
                Manage Google Account
              </button>

              <div className="w-full h-px bg-white/10 my-2" />

              <div className="w-full flex flex-col gap-1">
                <button className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-800 transition-colors text-zinc-300 w-full text-left">
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
                <button className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-800 transition-colors text-zinc-300 w-full text-left">
                  <User size={18} />
                  <span>Switch account</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
