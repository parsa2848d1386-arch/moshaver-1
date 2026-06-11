'use client';

import { useState } from 'react';
import type { UserProfile, UserSettings } from '@/types';
import { AI_MODELS, AVATARS } from '@/constants';

interface SettingsPanelProps {
  profile: UserProfile;
  settings: UserSettings;
  onSave: (profile: Partial<UserProfile>, settings: UserSettings) => void;
  onClearChat: () => void;
  onExport: () => void;
}

export default function SettingsPanel({
  profile,
  settings,
  onSave,
  onClearChat,
  onExport,
}: SettingsPanelProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [aiModel, setAiModel] = useState(settings.aiModel);
  const [customApiKey, setCustomApiKey] = useState(settings.customApiKey);
  const [customModelName, setCustomModelName] = useState(settings.customModelName);
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme);
  const [dndEnabled, setDndEnabled] = useState(settings.dndEnabled || false);
  const [dndStart, setDndStart] = useState(settings.dndStart || '22:00');
  const [dndEnd, setDndEnd] = useState(settings.dndEnd || '08:00');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      onSave(
        { displayName, avatar },
        {
          aiModel,
          customApiKey,
          customModelName,
          theme,
          dndEnabled,
          dndStart,
          dndEnd,
          notificationsEnabled: settings.notificationsEnabled,
        },
      );
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  return (
    <div className="settings-container">
      {/* Profile Section */}
      <div className="settings-section">
        <div className="settings-section-title">👤 پروفایل</div>

        <div className="input-group">
          <label className="input-label">نام نمایشی</label>
          <input
            className="input-field"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="نام خودت رو وارد کن"
          />
        </div>

        <div className="input-group">
          <label className="input-label">آواتار</label>
          <div className="profile-avatar-select">
            {AVATARS.map((av) => (
              <button
                key={av}
                className={`avatar-option ${avatar === av ? 'selected' : ''}`}
                onClick={() => setAvatar(av)}
              >
                {av}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Model Section */}
      <div className="settings-section">
        <div className="settings-section-title">🤖 مدل هوش مصنوعی</div>
        <div className="model-grid">
          {AI_MODELS.map((model) => (
            <div
              key={model.id}
              className={`model-option ${aiModel === model.id ? 'selected' : ''}`}
              onClick={() => setAiModel(model.id)}
            >
              <span className="model-name">{model.name}</span>
              <span className="model-desc">{model.desc}</span>
            </div>
          ))}
        </div>

        {aiModel === 'custom' && (
          <div style={{ marginTop: 12 }}>
            <div className="input-group">
              <label className="input-label">نام مدل دلخواه</label>
              <input
                className="input-field"
                type="text"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                placeholder="مثلاً: gemini-2.5-pro-preview"
                dir="ltr"
              />
            </div>
          </div>
        )}
      </div>

      {/* API Key Section */}
      <div className="settings-section">
        <div className="settings-section-title">🔑 کلید API اختصاصی</div>
        <div className="input-group">
          <label className="input-label">کلید Google AI</label>
          <input
            className="input-field"
            type="password"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="AIza..."
            dir="ltr"
          />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }}>
          اختیاری — اگه کلید خودت رو داری وارد کن تا سریع‌تر جواب بگیری.
        </p>
      </div>

      {/* Theme Section */}
      <div className="settings-section">
        <div className="settings-section-title">🎨 ظاهر</div>
        <div className="settings-row">
          <span className="settings-row-label">
            {theme === 'dark' ? '🌙 حالت تاریک' : '☀️ حالت روشن'}
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* DND Section */}
      <div className="settings-section">
        <div className="settings-section-title">🔕 مزاحم نشوید</div>
        <div className="settings-row">
          <span className="settings-row-label">فعال‌سازی حالت DND</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={dndEnabled}
              onChange={() => setDndEnabled(!dndEnabled)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        {dndEnabled && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">از ساعت</label>
              <input
                className="input-field"
                type="time"
                value={dndStart}
                onChange={(e) => setDndStart(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">تا ساعت</label>
              <input
                className="input-field"
                type="time"
                value={dndEnd}
                onChange={(e) => setDndEnd(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="settings-section">
        <div className="settings-section-title">📧 اطلاعات حساب</div>
        <div className="settings-row">
          <span className="settings-row-label">ایمیل</span>
          <span className="settings-row-value">{profile.email}</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">نقش</span>
          <span className="settings-row-value">
            {profile.role === 'parsa' ? '👨‍💻 پارسا' : '👩‍🎨 ملیکا'}
          </span>
        </div>
        {profile.createdAt && (
          <div className="settings-row">
            <span className="settings-row-label">عضویت</span>
            <span className="settings-row-value">
              {new Date(profile.createdAt).toLocaleDateString('fa-IR')}
            </span>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '⏳ ذخیره...' : '💾 ذخیره تغییرات'}
      </button>

      {/* Data Management */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onExport} style={{ flex: 1 }}>
          📤 خروجی گرفتن
        </button>
        <button className="btn btn-danger" onClick={onClearChat} style={{ flex: 1 }}>
          🗑️ پاک کردن چت
        </button>
      </div>
    </div>
  );
}
