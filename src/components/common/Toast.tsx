'use client';

import type { Toast as ToastType } from '@/types';

interface ToastContainerProps {
  toasts: ToastType[];
}

const TOAST_ICONS: Record<ToastType['type'], string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

export default function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}${toast.exiting ? ' toast-exit' : ''}`}
        >
          <span>{TOAST_ICONS[toast.type]}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
