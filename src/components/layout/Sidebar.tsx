'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BarChart2, HeartHandshake, Settings, LogOut, Search, Plus, User } from 'lucide-react';
import type { UserProfile, ActiveTab } from '@/types';

interface SidebarProps {
  profile: UserProfile;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TAB_ITEMS: { key: ActiveTab; icon: React.ReactNode; label: string }[] = [
  { key: 'chat', icon: <MessageSquare size={16} />, label: 'گفتگو' },
  { key: 'insights', icon: <BarChart2 size={16} />, label: 'تحلیل روانشناختی' },
  { key: 'engagement', icon: <HeartHandshake size={16} />, label: 'تعامل و تمرین‌ها' },
  { key: 'settings', icon: <Settings size={16} />, label: 'تنظیمات سیستم' },
];

export default function Sidebar({ profile, activeTab, onTabChange, onLogout, isOpen, onToggle }: SidebarProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

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
              onClick={onToggle}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
              dir="rtl"
            >
              {/* Header / New Chat */}
              <div className="p-4 flex flex-col gap-4">
                <button
                  onClick={() => {
                    onTabChange('chat');
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 p-3 rounded-2xl transition-colors border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium">چت جدید</span>
                </button>

                <div className="relative">
                  <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="جستجو..."
                    className="w-full bg-zinc-900 border border-white/5 rounded-full py-2.5 pr-10 pl-4 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6 scrollbar-hide">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <User size={14} /> بخش‌های اپلیکیشن
                  </h3>
                  <div className="flex flex-col gap-1">
                    {TAB_ITEMS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          onTabChange(tab.key);
                          if (window.innerWidth < 768) onToggle();
                        }}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-colors text-sm text-right font-medium ${
                          activeTab === tab.key 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent'
                        }`}
                      >
                        <span className={activeTab === tab.key ? 'text-blue-400' : 'text-zinc-500'}>
                          {tab.icon}
                        </span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile Section (Bottom) */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-zinc-900 transition-colors text-right"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {profile.avatar || 'P'}
                  </div>
                  <div className="flex flex-col items-start flex-1 overflow-hidden">
                    <span className="text-sm font-medium text-zinc-200 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                      {profile.displayName}
                    </span>
                    <span className="text-xs text-zinc-500">کاربر ویژه</span>
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
            dir="rtl"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                {profile.avatar || 'P'}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white">{profile.displayName}</h2>
                <p className="text-zinc-400 text-sm">حساب ویژه مشاور همراه</p>
              </div>

              <div className="w-full h-px bg-white/10 my-2" />

              <div className="w-full flex flex-col gap-2">
                <button 
                  onClick={() => {
                    setShowProfileModal(false);
                    onTabChange('settings');
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-zinc-200 w-full text-right"
                >
                  <Settings size={18} className="text-zinc-400" />
                  <span className="font-medium">تنظیمات حساب کاربری</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowProfileModal(false);
                    onLogout();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors text-red-400 w-full text-right"
                >
                  <LogOut size={18} />
                  <span className="font-medium">خروج از حساب</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
