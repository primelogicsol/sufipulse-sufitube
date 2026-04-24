"use client";

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error caught:', error);
    }

    // Optional: Send to monitoring service
    if (typeof window !== 'undefined') {
      // Could integrate with Sentry, Datadog, etc.
    }
  }, [error]);

  return (
    <html>
      <body className="bg-black text-neutral-200">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-lg">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-400/10 flex items-center justify-center border border-red-400/30">
                <span className="text-5xl font-serif text-red-400">!</span>
              </div>
            </div>

            <h1 className="text-3xl font-serif font-light text-neutral-100 mb-4">
              Something Went Wrong
            </h1>

            <p className="text-neutral-400 mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>

            {process.env.NODE_ENV === 'development' && error?.message && (
              <div className="mb-6 p-4 bg-neutral-900 border border-red-800/40 rounded-lg text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Error digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => reset()}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-medium"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
