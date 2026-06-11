'use client';

import React, { useState, useEffect } from 'react';

interface OfflineBannerProps {
  /** Override online/offline status (useful for testing) */
  forceOffline?: boolean;
  /** Number of pending messages waiting to sync */
  pendingCount?: number;
}

/**
 * A small banner that appears at the top of the screen when the user is offline.
 * Slides in/out with a smooth animation.
 * Shows the number of pending messages if any.
 */
export default function OfflineBanner({ forceOffline, pendingCount = 0 }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine actual offline state
  const actuallyOffline = forceOffline !== undefined ? forceOffline : !isOnline;

  // Animate in/out
  useEffect(() => {
    if (actuallyOffline) {
      // Small delay for mount animation
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [actuallyOffline]);

  // Don't render if online and animation complete
  if (!actuallyOffline && !isVisible) {
    return null;
  }

  return (
    <div
      className="offline-banner"
      role="alert"
      aria-live="assertive"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="offline-banner-content">
        <span className="offline-banner-icon">📡</span>
        <span className="offline-banner-text">
          آفلاین — پیام‌های شما پس از اتصال ارسال می‌شوند
        </span>
        {pendingCount > 0 && (
          <span className="offline-banner-count">
            {pendingCount} پیام در صف
          </span>
        )}
      </div>
    </div>
  );
}
