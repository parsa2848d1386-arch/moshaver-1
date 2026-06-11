'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon">😵</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            یه مشکلی پیش اومد!
          </h3>
          <p className="empty-state-text">
            متأسفانه یه خطای غیرمنتظره رخ داد.
            <br />
            لطفاً دوباره امتحان کن.
          </p>
          {this.state.error && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                direction: 'ltr',
                maxWidth: 300,
                wordBreak: 'break-all',
                marginTop: 8,
              }}
            >
              {this.state.error.message}
            </p>
          )}
          <button
            className="btn btn-primary"
            style={{ marginTop: 16, maxWidth: 200 }}
            onClick={this.handleRetry}
          >
            🔄 تلاش دوباره
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
