import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    commit: process.env.NEXT_PUBLIC_APP_COMMIT || process.env.APP_COMMIT || 'unknown',
    builtAt: process.env.BUILD_TIME || 'unknown',
    environment: process.env.NODE_ENV,
  });
}
