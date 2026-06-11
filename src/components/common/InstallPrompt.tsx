'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'moshaver-install-dismissed';
const DISMISSED_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * PWA Install Prompt component.
 *
 * - Listens for the `beforeinstallprompt` event
 * - Shows a beautiful install banner with Persian text
 * - Allows user to dismiss (with 7-day cooldown)
 * - Triggers native install prompt on click
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Check if dismissed recently
  const wasDismissedRecently = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) return false;
      const dismissedAt = parseInt(dismissed, 10);
      return Date.now() - dismissedAt < DISMISSED_COOLDOWN_MS;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Don't show if already dismissed recently
    if (wasDismissedRecently()) return;

    const handleBeforeInstall = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom prompt with a slight delay for animation
      setTimeout(() => setIsVisible(true), 1000);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      // Clean up dismissed state
      localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [wasDismissedRecently]);

  // Handle install button click
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        animateOut();
      } else {
        // User dismissed native prompt — keep banner visible
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('[InstallPrompt] Install failed:', error);
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  // Handle dismiss button click
  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {
      // localStorage might be full
    }
    animateOut();
  }, []);

  // Animate out before removing from DOM
  const animateOut = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
    }, 400);
  };

  // Don't render if not visible
  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div
      ref={bannerRef}
      className={`install-prompt ${isAnimatingOut ? 'install-prompt-exit' : ''}`}
      role="dialog"
      aria-label="نصب اپلیکیشن"
    >
      {/* Dismiss button */}
      <button
        className="install-prompt-dismiss"
        onClick={handleDismiss}
        aria-label="بستن"
        type="button"
      >
        ✕
      </button>

      {/* App icon */}
      <div className="install-prompt-icon">
        💜
      </div>

      {/* Content */}
      <div className="install-prompt-content">
        <h3 className="install-prompt-title">
          مشاور همراه را نصب کنید
        </h3>
        <p className="install-prompt-desc">
          با نصب اپلیکیشن، دسترسی سریع‌تر و تجربه بهتری داشته باشید — حتی آفلاین!
        </p>
      </div>

      {/* Action buttons */}
      <div className="install-prompt-actions">
        <button
          className="btn btn-primary install-prompt-btn"
          onClick={handleInstall}
          disabled={isInstalling}
          type="button"
        >
          {isInstalling ? (
            <>
              <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              در حال نصب...
            </>
          ) : (
            <>
              📲 نصب اپلیکیشن
            </>
          )}
        </button>
        <button
          className="install-prompt-later"
          onClick={handleDismiss}
          type="button"
        >
          بعداً یادآوری کن
        </button>
      </div>
    </div>
  );
}
