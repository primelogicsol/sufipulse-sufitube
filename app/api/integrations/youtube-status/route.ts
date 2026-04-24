import { NextResponse } from 'next/server';

export async function GET() {
  const required = [
    {
      key: 'YOUTUBE_OAUTH_CLIENT_ID',
      fallback: 'YOUTUBE_CLIENT_ID',
      value: process.env.YOUTUBE_OAUTH_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '',
    },
    {
      key: 'YOUTUBE_OAUTH_CLIENT_SECRET',
      fallback: 'YOUTUBE_CLIENT_SECRET',
      value: process.env.YOUTUBE_OAUTH_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '',
    },
    {
      key: 'YOUTUBE_OAUTH_REFRESH_TOKEN',
      fallback: 'YOUTUBE_REFRESH_TOKEN',
      value: process.env.YOUTUBE_OAUTH_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN || '',
    },
  ];

  const missing = required
    .filter((item) => !String(item.value || '').trim())
    .map((item) => `${item.key} (or ${item.fallback})`);

  return NextResponse.json({
    configured: missing.length === 0,
    missing,
    message:
      missing.length === 0
        ? 'YouTube OAuth is configured.'
        : 'YouTube OAuth is not fully configured.',
  });
}
