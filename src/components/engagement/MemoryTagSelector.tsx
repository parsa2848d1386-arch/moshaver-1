'use client';

import { MEMORY_TAG_OPTIONS } from '@/constants';

interface MemoryTagSelectorProps {
  onTag: (tag: string) => void;
  onClose: () => void;
}

export default function MemoryTagSelector({ onTag, onClose }: MemoryTagSelectorProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 8,
        background: 'var(--card-bg-solid)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        padding: 12,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        animation: 'bounceIn 0.3s ease',
        zIndex: 60,
        minWidth: 200,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
          🏷️ ثبت خاطره
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      {/* Tag options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {MEMORY_TAG_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => {
              onTag(`${option.emoji} ${option.label}`);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-main)',
              fontFamily: 'Vazirmatn, sans-serif',
              transition: 'all 0.15s ease',
              textAlign: 'right',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            }}
          >
            <span style={{ fontSize: 18 }}>{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
