import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), '.data', 'cms-releases.json');

export async function GET(request: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'degraded' | 'error'; details?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check 1: File system — existence + writability
  try {
    const dataDir = path.join(process.cwd(), '.data');
    fs.mkdirSync(dataDir, { recursive: true });
    const testFile = path.join(dataDir, '.health-write-test');
    fs.writeFileSync(testFile, 'ok', 'utf8');
    fs.unlinkSync(testFile);
    const details = fs.existsSync(DATA_FILE)
      ? `writable, data file ${(fs.statSync(DATA_FILE).size / 1024).toFixed(1)}KB`
      : 'writable, data file not yet created';
    checks.dataStorage = { status: 'ok', details };
  } catch (error: any) {
    checks.dataStorage = { status: 'error', details: error.message };
    overallStatus = 'unhealthy';
  }

  // Check 2: Required environment variables
  const requiredEnvVars = ['NEXT_PUBLIC_APP_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const shortSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'].filter(
    (v) => process.env[v] && (process.env[v]?.length ?? 0) < 32
  );
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingEnvVars.length === 0 && shortSecrets.length === 0) {
    checks.environment = { status: 'ok', details: 'All required environment variables present' };
  } else {
    const issues: string[] = [];
    if (missingEnvVars.length > 0) issues.push(`Missing: ${missingEnvVars.join(', ')}`);
    if (shortSecrets.length > 0) issues.push(`Too short (<32 chars): ${shortSecrets.join(', ')}`);
    checks.environment = { status: 'error', details: issues.join('; ') };
    overallStatus = 'unhealthy';
  }

  // Check 3: Optional integrations
  const integrations: string[] = [];
  if (process.env.STRIPE_SECRET_KEY) integrations.push('stripe');
  if (process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) integrations.push('youtube');
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) integrations.push('google-ads');
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) integrations.push('smtp');

  checks.integrations = {
    status: integrations.length > 0 ? 'ok' : 'degraded',
    details: integrations.length > 0 ? `Configured: ${integrations.join(', ')}` : 'No optional integrations configured',
  };

  // Check 4: Uptime
  const uptimeSeconds = process.uptime();
  checks.uptime = {
    status: 'ok',
    details: `${Math.floor(uptimeSeconds)} seconds`,
  };

  // Check 5: Memory usage
  const memUsage = process.memoryUsage();
  checks.memory = {
    status: memUsage.heapUsed > 500 * 1024 * 1024 ? 'degraded' : 'ok',
    details: `RSS: ${(memUsage.rss / 1024 / 1024).toFixed(1)}MB, Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
  };

  if (memUsage.heapUsed > 500 * 1024 * 1024) {
    overallStatus = 'degraded';
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
