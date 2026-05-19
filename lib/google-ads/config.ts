// lib/google-ads/config.ts
import 'server-only';

export const ADS_API_VERSION = 'v22';

export type GoogleAdsConfig = {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  redirectUri: string;
  loginCustomerId: string;
  createMode: 'manual_review' | 'auto';
};

export type GoogleAdsAvailability = {
  available: boolean;
  oauthReady: boolean;
  mode: 'manual_review' | 'auto';
  message: string;
  missing?: string[];
  redirectUri?: string;
};

export function getGoogleAdsConfig(): GoogleAdsConfig {
  return {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    redirectUri: process.env.GOOGLE_ADS_REDIRECT_URI || '',
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
    createMode: (process.env.GOOGLE_ADS_CREATE_MODE as any) === 'auto' ? 'auto' : 'manual_review',
  };
}

export function getGoogleAdsAvailability(isAdmin: boolean = false): GoogleAdsAvailability {
  const config = getGoogleAdsConfig();
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost = isDev || process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
  
  // Feature flag for public exposure (default false)
  const ENABLE_PUBLIC_DIRECT = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ADS_DIRECT === 'true';

  const REQUIRED_VARS = [
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_REDIRECT_URI'
  ];
  
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  const configComplete = missing.length === 0;

  // QUARANTINE LOGIC:
  // 1. If public exposure flag is on, it's available for everyone if config is complete.
  // 2. If flag is off, it is ONLY available for admins in development/localhost.
  // 3. Otherwise, it's unavailable (Under Enhancement).
  
  const available = !!(configComplete && (ENABLE_PUBLIC_DIRECT || (isAdmin && (isDev || isLocalhost))));

  const result: GoogleAdsAvailability = {
    available,
    oauthReady: configComplete,
    mode: config.createMode,
    message: available 
      ? 'Google Ads Direct is available for testing.' 
      : 'Google Ads Direct is under infrastructure enhancement. Managed by SufiPulse is available.',
  };

  if (isAdmin && missing.length > 0) {
    result.missing = missing;
  }

  return result;
}

export function assertGoogleAdsConfigured(): GoogleAdsConfig {
  const config = getGoogleAdsConfig();
  if (!config.clientId || !config.clientSecret || !config.developerToken) {
    throw new Error('Google Ads environment variables are not fully configured.');
  }
  return config;
}
