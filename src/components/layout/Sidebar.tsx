'use client';

import React from 'react';
import { MessageSquare, BarChart2, HeartHandshake, Settings, LogOut, Menu, X } from 'lucide-react';
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
  { key: 'chat', icon: <MessageSquare size={20} />, label: 'چت' },
  { key: 'insights', icon: <BarChart2 size={20} />, label: 'تحلیل' },
  { key: 'engagement', icon: <HeartHandshake size={20} />, label: 'تعامل' },
  { key: 'settings', icon: <Settings size={20} />, label: 'تنظیمات' },
];

export default function Sidebar({ profile, activeTab, onTabChange, onLogout, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={onToggle}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }}
        />
      )}

      {/* Sidebar Container */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ 
        padding: '20px 16px', 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
      }}>
        {/* Mobile Close Button */}
        <button 
          className="md:hidden self-end mb-4 text-gray-400 hover:text-white"
          onClick={onToggle}
          style={{ alignSelf: 'flex-end', marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={24} />
        </button>

        {/* Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            {profile.avatar}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {profile.displayName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              مشاور همراه
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                onTabChange(tab.key);
                if (window.innerWidth < 768) onToggle();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.key ? 'var(--primary-glow)' : 'transparent',
                color: activeTab === tab.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 600 : 500,
                transition: 'all 0.2s ease',
                width: '100%',
                textAlign: 'right'
              }}
            >
              <span style={{ opacity: activeTab === tab.key ? 1 : 0.7 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--danger-bg)',
            color: 'var(--danger-color)',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            width: '100%',
            textAlign: 'right',
            marginTop: 'auto'
          }}
        >
          <LogOut size={20} />
          خروج از حساب
        </button>
      </div>
    </>
  );
}
