'use client';

import type { UserProfile, ActiveTab } from '@/types';

interface ChatHeaderProps {
  profile: UserProfile;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  partnerTyping?: boolean;
}

const TAB_ITEMS: { key: ActiveTab; icon: string; label: string }[] = [
  { key: 'chat', icon: '💬', label: 'چت' },
  { key: 'insights', icon: '📊', label: 'تحلیل' },
  { key: 'engagement', icon: '💝', label: 'تعامل' },
  { key: 'settings', icon: '⚙️', label: 'تنظیمات' },
];

export default function ChatHeader({
  profile,
  activeTab,
  onTabChange,
  onLogout,
  partnerTyping,
}: ChatHeaderProps) {
  return (
    <div className="chat-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          {profile.avatar}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {profile.displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--success-color)',
                    display: 'inline-block',
                  }}
                />
                آنلاین
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-icon ${
              activeTab === tab.key ? '' : 'btn-secondary'
            }`}
            style={
              activeTab === tab.key
                ? {
                    background:
                      'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                    color: 'white',
                    border: 'none',
                  }
                : {}
            }
            onClick={() => onTabChange(tab.key)}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
        <button
          className="btn btn-icon btn-secondary"
          onClick={onLogout}
          title="خروج"
          style={{ marginRight: 4 }}
        >
          🚪
        </button>
      </div>
    </div>
  );
}
