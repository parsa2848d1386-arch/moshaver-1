'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res = await fetch('/api/insights');
          if (res.ok) {
            const data = await res.json();
            setMemories(data);
          }
        } catch (err) {
          console.error("Error fetching insights", err);
        }
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="mobile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // گرفتن آخرین حافظه
  const latestMemory = memories.length > 0 ? memories[memories.length - 1] : null;
  const healthScore = latestMemory?.memory?.health_score || 0;

  return (
    <div className="mobile-container">
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => router.push('/')} className="btn-icon btn-secondary" style={{ border: 'none' }}>
            ←
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>داشبورد تحلیل رابطه 📊</h2>
        </div>
      </header>

      <div className="settings-container" style={{ padding: '20px' }}>
        
        {/* سلامت رابطه */}
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '16px' }}>سلامت رابطه (امروز)</h3>
          
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--card-border)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={healthScore > 70 ? "var(--success-color)" : healthScore > 40 ? "var(--warning-color)" : "var(--danger-color)"}
                strokeWidth="3"
                strokeDasharray={`${healthScore}, 100`}
                className="animate-spin-slow"
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px', fontWeight: 'bold' }}>
              {healthScore}%
            </div>
          </div>
          <p style={{ marginTop: '16px', fontSize: '13px', lineHeight: '1.6' }}>
            {latestMemory?.memory?.summary || "اطلاعاتی برای نمایش وجود ندارد. با هم گفتگو کنید تا هوش مصنوعی رابطه شما را تحلیل کند."}
          </p>
        </div>

        {latestMemory?.memory && (
          <>
            {/* احساسات غالب */}
            <div className="settings-section animate-slide-right" style={{ animationDelay: '0.1s' }}>
              <div className="settings-section-title">🎭 احساسات غالب</div>
              
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>پارسا:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {latestMemory.memory.dominant_emotions?.parsa?.map((e: string, i: number) => (
                    <span key={i} style={{ padding: '4px 10px', background: 'var(--bubble-user-parsa)', borderRadius: '12px', fontSize: '12px', color: 'white' }}>{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ملیکا:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {latestMemory.memory.dominant_emotions?.melika?.map((e: string, i: number) => (
                    <span key={i} style={{ padding: '4px 10px', background: 'var(--bubble-user-melika)', borderRadius: '12px', fontSize: '12px', color: 'white' }}>{e}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* الگوهای رفتاری و نقاط قوت */}
            <div className="settings-section animate-slide-left" style={{ animationDelay: '0.2s' }}>
              <div className="settings-section-title">🔍 الگوها و نقاط قوت</div>
              <ul style={{ listStyleType: 'none', padding: 0, fontSize: '13px', lineHeight: '1.8' }}>
                {latestMemory.memory.behavioral_patterns?.map((p: string, i: number) => (
                  <li key={i} style={{ marginBottom: '8px' }}>🔄 {p}</li>
                ))}
                {latestMemory.memory.positive_highlights?.map((p: string, i: number) => (
                  <li key={`p-${i}`} style={{ color: 'var(--success-color)' }}>✨ {p}</li>
                ))}
              </ul>
            </div>

            {/* مشکلات حل نشده */}
            {latestMemory.memory.unresolved_issues?.length > 0 && (
              <div className="settings-section animate-slide-right" style={{ animationDelay: '0.3s' }}>
                <div className="settings-section-title" style={{ color: 'var(--warning-color)' }}>⚠️ نیازمند توجه</div>
                <ul style={{ listStyleType: 'none', padding: 0, fontSize: '13px', lineHeight: '1.8' }}>
                  {latestMemory.memory.unresolved_issues.map((p: string, i: number) => (
                    <li key={i}>🚩 {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        
        {/* تاریخچه نمودار */}
        <div className="settings-section animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="settings-section-title">📈 تاریخچه (هفته گذشته)</div>
          <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '20px' }}>
            {memories.map((m, i) => {
              const h = m.memory?.health_score || 0;
              const height = `${Math.max(h, 10)}%`;
              const bg = h > 70 ? 'var(--success-color)' : h > 40 ? 'var(--warning-color)' : 'var(--danger-color)';
              
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{h}</div>
                  <div style={{ width: '100%', height, background: bg, borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'height 1s ease' }}></div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{m.date.split('-')[2]}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
