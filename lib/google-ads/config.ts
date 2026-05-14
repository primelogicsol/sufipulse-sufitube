// lib/google-ads/config.ts
import 'server-only';

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
  
  const REQUIRED_VARS = [
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_REDIRECT_URI'
  ];
  
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  const available = missing.length === 0;
  const oauthReady = available && !!process.env.GOOGLE_ADS_CLIENT_SECRET;

  const result: GoogleAdsAvailability = {
    available,
    oauthReady,
    mode: config.createMode,
    message: available 
      ? 'Google Ads Direct is available.' 
      : 'Google Ads integration is temporarily unavailable.',
  };

  if (isAdmin && missing.length > 0) {
    result.missing = missing;
    result.redirectUri = config.redirectUri || '/api/google-ads/oauth/callback';
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
