'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Camera, FileText, Cloud, Book, Brain, ToggleLeft, ToggleRight, Brush } from 'lucide-react';

interface GeminiBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GeminiBottomSheet({ isOpen, onClose }: GeminiBottomSheetProps) {
  const [personalIntelligence, setPersonalIntelligence] = useState(true);

  const topPills = [
    { id: 'photos', icon: <ImageIcon size={18} />, label: 'Photos' },
    { id: 'camera', icon: <Camera size={18} />, label: 'Camera' },
    { id: 'files', icon: <FileText size={18} />, label: 'Files' },
    { id: 'drive', icon: <Cloud size={18} />, label: 'Drive' },
    { id: 'notebooks', icon: <Book size={18} />, label: 'Notebooks' },
  ];

  return (
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

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl border-t border-white/10 z-50 flex flex-col max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-3" onClick={onClose}>
              <div className="w-12 h-1.5 rounded-full bg-zinc-700 cursor-pointer" />
            </div>

            <div className="p-4 flex flex-col gap-6 overflow-y-auto">
              {/* Horizontal Pills */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {topPills.map((pill) => (
                  <button
                    key={pill.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-800 border border-white/5 hover:bg-zinc-700 transition-colors whitespace-nowrap text-zinc-200 text-sm font-medium"
                  >
                    <span className="text-blue-400">{pill.icon}</span>
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Advanced Actions List */}
              <div className="flex flex-col gap-2">
                <button className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Brush size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-200 font-medium">Images</span>
                    <span className="text-zinc-500 text-sm">Create and edit images</span>
                  </div>
                </button>

                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Brain size={20} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-zinc-200 font-medium">Personal Intelligence</span>
                    <span className="text-zinc-500 text-sm">Learn from my conversations</span>
                  </div>
                  <button
                    onClick={() => setPersonalIntelligence(!personalIntelligence)}
                    className="text-zinc-400"
                  >
                    {personalIntelligence ? (
                      <ToggleRight size={32} className="text-blue-500" />
                    ) : (
                      <ToggleLeft size={32} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
