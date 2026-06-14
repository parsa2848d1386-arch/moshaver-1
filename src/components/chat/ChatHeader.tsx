'use client';

import type { UserProfile, ActiveTab } from '@/types';
import { Menu } from 'lucide-react';

interface ChatHeaderProps {
  profile: UserProfile;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  partnerTyping?: boolean;
  onMenuClick: () => void;
}

export default function ChatHeader({
  profile,
  activeTab,
  onTabChange,
  onLogout,
  partnerTyping,
  onMenuClick
}: ChatHeaderProps) {
  const getTabTitle = () => {
    switch(activeTab) {
      case 'chat': return 'گفتگو';
      case 'insights': return 'تحلیل روانشناختی';
      case 'engagement': return 'تعامل و تمرین‌ها';
      case 'settings': return 'تنظیمات سیستم';
      default: return 'مشاور همراه';
    }
  };

  return (
    <div className="chat-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          className="md:hidden btn btn-icon btn-secondary" 
          onClick={onMenuClick}
          style={{ border: 'none', background: 'transparent' }}
        >
          <Menu size={24} />
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {getTabTitle()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {partnerTyping ? (
              <span style={{ color: 'var(--primary-color)' }}>
                در حال تایپ
                <span className="typing-dot" style={{ marginRight: 4 }} />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--success-color)',
                    display: 'inline-block',
                    boxShadow: '0 0 8px var(--success-color)'
                  }}
                />
                آنلاین
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
