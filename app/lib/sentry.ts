import * as Sentry from "@sentry/nextjs";

/**
 * Track a custom error event with additional context.
 * Use this for errors that occur outside of try/catch blocks
 * or when you want to add rich context to an error.
 */
export function trackError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    fingerprint?: string[];
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  }
): string | undefined {
  const err = error instanceof Error ? error : new Error(String(error));

  if (context?.user) {
    Sentry.setUser(context.user);
  }

  const eventId = Sentry.captureException(err, {
    tags: context?.tags,
    extra: context?.extra,
    fingerprint: context?.fingerprint,
  });

  return eventId;
}

/**
 * Track a message to Sentry (info, warning, or error level).
 */
export function trackMessage(
  message: string,
  options?: {
    level?: "info" | "warning" | "error";
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string | undefined {
  return Sentry.captureMessage(message, {
    level: options?.level ?? "info",
    tags: options?.tags,
    extra: options?.extra,
  });
}

/**
 * Track a custom event with structured data.
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  Sentry.captureEvent({
    message: eventName,
    tags: { event_type: eventName },
    extra: properties,
  });
}

/**
 * Set the current user context for subsequent error tracking.
 * Call this after authentication.
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear the current user context.
 * Call this on logout.
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for tracking user actions leading up to an error.
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level: level ?? "info",
    data,
  });
}

/**
 * Start a performance tracing span.
 * Returns a span that should be ended when the operation completes.
 */
export function startSpan(name: string, op?: string): ReturnType<typeof Sentry.startInactiveSpan> {
  return Sentry.startInactiveSpan({ name, op });
}

/**
 * Wrap an async function with error tracking.
 * Automatically captures errors and re-throws them.
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  spanName: string = "tracked-operation"
): Promise<T> {
  return Sentry.startSpan({ name: spanName }, async () => {
    try {
      return await fn();
    } catch (error) {
      trackError(error);
      throw error;
    }
  });
}

/**
 * Wrap a synchronous function with error tracking.
 */
export function withErrorTrackingSync<T>(
  fn: () => T,
  spanName: string = "tracked.sync-operation"
): T {
  return Sentry.startSpan({ name: spanName }, () => {
    try {
      return fn();
    } catch (error) {
      trackError(error);
      throw error;
    }
  });
}
