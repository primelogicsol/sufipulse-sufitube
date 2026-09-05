import { timingSafeEqual } from 'crypto';

export const GOOGLE_LOGIN_CALLBACK_PATH = '/api/auth/google/callback';
export const GOOGLE_LOGIN_BRIDGE_PATH = '/api/google-ads/oauth/callback';

export interface GoogleAuthConfig {
  appUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function normalizeAppUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getGoogleAuthConfig(): GoogleAuthConfig | null {
  const appUrl = normalizeAppUrl(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'
  );
  const clientId = process.env.GOOGLE_AUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET?.trim();

  if (
    !appUrl ||
    !clientId ||
    !clientId.endsWith('.apps.googleusercontent.com') ||
    !clientSecret
  ) {
    return null;
  }

  const redirectUri =
    process.env.GOOGLE_AUTH_REDIRECT_URI?.trim() ||
    `${appUrl}${GOOGLE_LOGIN_CALLBACK_PATH}`;

  try {
    if (new URL(redirectUri).origin !== appUrl) return null;
  } catch {
    return null;
  }

  return { appUrl, clientId, clientSecret, redirectUri };
}

export function isGoogleLoginState(
  stateParam: string | null,
  stateCookie: string | undefined
): boolean {
  if (!stateParam || !stateCookie) return false;

  const paramBytes = Buffer.from(stateParam);
  const cookieBytes = Buffer.from(stateCookie);

  return (
    paramBytes.length === cookieBytes.length &&
    timingSafeEqual(paramBytes, cookieBytes)
  );
}
