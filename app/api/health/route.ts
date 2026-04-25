import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), '.data', 'cms-releases.json');

export async function GET(request: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'degraded' | 'error'; details?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check 1: File system access
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stats = fs.statSync(DATA_FILE);
      const fileSizeKB = (stats.size / 1024).toFixed(1);
      checks.dataStorage = {
        status: 'ok',
        details: `Data file exists, size: ${fileSizeKB}KB, modified: ${stats.mtime.toISOString()}`,
      };
    } else {
      checks.dataStorage = {
        status: 'degraded',
        details: 'Data file does not exist yet (first run)',
      };
    }
  } catch (error: any) {
    checks.dataStorage = { status: 'error', details: error.message };
    overallStatus = 'degraded';
  }

  // Check 2: Environment variables
  const requiredEnvVars = ['NEXT_PUBLIC_APP_URL'];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingEnvVars.length === 0) {
    checks.environment = { status: 'ok', details: 'All required environment variables present' };
  } else {
    checks.environment = {
      status: 'degraded',
      details: `Missing: ${missingEnvVars.join(', ')}`,
    };
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  }

  // Check 3: Optional integrations
  const integrations: string[] = [];
  if (process.env.STRIPE_SECRET_KEY) integrations.push('stripe');
  if (process.env.YOUTUBE_API_KEY) integrations.push('youtube');
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) integrations.push('google-ads');

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
