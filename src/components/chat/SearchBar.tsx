'use client';

import { useState, useCallback } from 'react';
import type { Message } from '@/types';
import { truncateText } from '@/utils/format';

interface SearchBarProps {
  onSearch: (q: string) => Promise<Message[]>;
  onClose: () => void;
  onGoToMessage: (messageId: string) => void;
}

export default function SearchBar({ onSearch, onClose, onGoToMessage }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const found = await onSearch(q.trim());
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [onSearch],
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--card-bg-solid)',
        borderBottom: '1px solid var(--card-border)',
        padding: 16,
        animation: 'fadeInUp 0.3s ease',
        maxHeight: '60vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search input header */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          className="input-field"
          type="text"
          placeholder="جستجو در پیام‌ها..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-icon btn-secondary"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Loading */}
      {searching && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
        </div>
      )}

      {/* Results */}
      {!searching && results.length > 0 && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            {results.length} نتیجه
          </div>
          {results.map((msg) => (
            <div
              key={msg.id}
              onClick={() => onGoToMessage(msg.id || '')}
              style={{
                padding: '10px 14px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-color)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                  {msg.senderName}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', direction: 'ltr' }}>
                  {new Date(msg.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {truncateText(msg.text, 100)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            fontSize: 14,
            color: 'var(--text-muted)',
          }}
        >
          🔍 نتیجه‌ای پیدا نشد
        </div>
      )}
    </div>
  );
}
