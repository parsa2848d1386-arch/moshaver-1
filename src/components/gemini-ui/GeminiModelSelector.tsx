'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Sparkles } from 'lucide-react';

interface GeminiModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  thinkingLevel: 'standard' | 'extended';
  onSelectThinkingLevel: (level: 'standard' | 'extended') => void;
}

export default function GeminiModelSelector({
  selectedModel,
  onSelectModel,
  thinkingLevel,
  onSelectThinkingLevel,
}: GeminiModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showThinkingOpts, setShowThinkingOpts] = useState(false);

  const models = [
    { id: 'flash-lite', name: '3.1 Flash-Lite', badge: 'Fast' },
    { id: 'flash', name: '3.5 Flash', badge: '' },
    { id: 'pro', name: '3.1 Pro', badge: 'Advanced' },
  ];

  const currentModelName = models.find(m => m.id === selectedModel)?.name || 'Gemini';

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 border border-white/5 hover:bg-zinc-800/80 transition-colors backdrop-blur-md"
      >
        <Sparkles size={16} className="text-blue-400" />
        <span className="text-zinc-200 font-medium text-sm">Gemini {currentModelName}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-zinc-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full mt-2 w-72 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl right-0 sm:left-0 sm:right-auto"
            style={{ transformOrigin: 'top center' }}
          >
            <div className="p-2 flex flex-col gap-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors ${
                    selectedModel === model.id ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {model.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {model.badge}
                      </span>
                    )}
                  </div>
                  {selectedModel === model.id && <Check size={16} />}
                </button>
              ))}
            </div>

            <div className="border-t border-white/5 p-2 bg-zinc-950/50">
              <button
                onClick={() => setShowThinkingOpts(!showThinkingOpts)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <span>Thinking level</span>
                <motion.div animate={{ rotate: showThinkingOpts ? 180 : 0 }}>
                  <ChevronDown size={14} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showThinkingOpts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 p-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${thinkingLevel === 'standard' ? 'border-blue-500' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                          {thinkingLevel === 'standard' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <span className="text-sm text-zinc-300">Standard</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${thinkingLevel === 'extended' ? 'border-blue-500' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                          {thinkingLevel === 'extended' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <span className="text-sm text-zinc-300">Extended</span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay for closing */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
