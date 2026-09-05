import assert from 'node:assert/strict';
import {
  GOOGLE_LOGIN_BRIDGE_PATH,
  getGoogleAuthConfig,
  isGoogleLoginState,
} from './server/services/google-auth-config';

const names = [
  'NEXT_PUBLIC_APP_URL',
  'GOOGLE_AUTH_CLIENT_ID',
  'GOOGLE_AUTH_CLIENT_SECRET',
  'GOOGLE_AUTH_REDIRECT_URI',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
] as const;

const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));

try {
  process.env.NEXT_PUBLIC_APP_URL = 'https://sufipulse.com/';
  delete process.env.GOOGLE_AUTH_CLIENT_ID;
  delete process.env.GOOGLE_AUTH_CLIENT_SECRET;
  process.env.GOOGLE_ADS_CLIENT_ID =
    '123456789-example.apps.googleusercontent.com';
  process.env.GOOGLE_ADS_CLIENT_SECRET = 'ads-secret';

  assert.equal(
    getGoogleAuthConfig(),
    null,
    'Google login must never fall back to Google Ads credentials'
  );

  process.env.GOOGLE_AUTH_CLIENT_ID = 'invalid-client';
  process.env.GOOGLE_AUTH_CLIENT_SECRET = 'auth-secret';
  assert.equal(getGoogleAuthConfig(), null, 'Malformed client IDs must fail closed');

  process.env.GOOGLE_AUTH_CLIENT_ID =
    '123456789-example.apps.googleusercontent.com';
  process.env.GOOGLE_AUTH_REDIRECT_URI =
    `https://sufipulse.com${GOOGLE_LOGIN_BRIDGE_PATH}`;

  assert.deepEqual(getGoogleAuthConfig(), {
    appUrl: 'https://sufipulse.com',
    clientId: '123456789-example.apps.googleusercontent.com',
    clientSecret: 'auth-secret',
    redirectUri:
      'https://sufipulse.com/api/google-ads/oauth/callback',
  });

  process.env.GOOGLE_AUTH_REDIRECT_URI =
    'https://attacker.example/api/auth/google/callback';
  assert.equal(
    getGoogleAuthConfig(),
    null,
    'Cross-origin redirect URIs must fail closed'
  );

  assert.equal(isGoogleLoginState('same-state', 'same-state'), true);
  assert.equal(isGoogleLoginState('same-state', 'other-state'), false);
  assert.equal(isGoogleLoginState(null, 'same-state'), false);

  console.log('Google auth configuration assertions passed.');
} finally {
  for (const name of names) {
    const value = original[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
