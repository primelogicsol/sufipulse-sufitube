"use client";

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error tracking service (e.g., Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    this.setState({
      hasError: error,
      errorInfo: errorInfo,
    });
  }

  public handleReset = () => {
    this.setState({
      hasError: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-[var(--color-slate)] border border-[var(--color-border-strong)] rounded-lg p-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                  Something went wrong
                </h2>

                <p className="text-[var(--color-text-secondary)] mb-4">
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.hasError && (
                  <details className="mb-4 p-4 bg-[var(--color-midnight)] rounded border border-[var(--color-border)]">
                    <summary className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-xs text-red-400 overflow-auto max-h-48 whitespace-pre-wrap">
                      {this.state.hasError.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-gray-500 overflow-auto max-h-48 mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-midnight)] rounded font-medium hover:bg-[var(--color-gold)]/90 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>

                  <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-midnight)] transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
