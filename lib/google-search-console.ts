/**
 * lib/google-search-console.ts
 *
 * Official Google Search Console API v1 / Webmasters v3 Integration for SufiPulse USA.
 *
 * GOVERNANCE RULES:
 * - Uses ONLY official Search Console APIs (Search Analytics, Sitemaps, URL Inspection).
 * - NEVER uses Google's restricted Indexing API (reserved for JobPosting/BroadcastEvent).
 * - NEVER treats Google Ads OAuth credentials as Search Console credentials.
 * - Reports explicit NOT_CONFIGURED status with exact setup instructions when
 *   GOOGLE_SEARCH_CONSOLE_PROPERTY or GSC credentials are absent.
 */

import fs from 'node:fs';
import { google } from 'googleapis';
import { CANONICAL_ORIGIN } from './canonical-seo';
import { appendIndexingEntry } from './search-indexing-service';

export type GscConnectionState =
  | 'CONNECTED'
  | 'CONFIGURED_UNVERIFIED'
  | 'NOT_CONFIGURED'
  | 'ERROR';

export interface GscStatusSnapshot {
  state: GscConnectionState;
  configured: boolean;
  property: string | null;
  authMode: 'service_account_file' | 'service_account_json' | 'oauth_refresh_token' | 'none';
  siteVerifiedInAccount: boolean;
  permissionLevel: string | null;
  lastCheckedAt: string;
  errorMessage: string | null;
  missingRequirements: string[];
  setupInstructions: string[];
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number; // percentage 0..100
  position: number;
  intentType: 'branded' | 'non_branded';
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscCountryRow {
  countryCode: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSearchAnalyticsReport {
  status: GscConnectionState;
  property: string | null;
  period: { startDate: string; endDate: string };
  fetchedAt: string;
  errorMessage: string | null;
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
    brandedClicks: number;
    nonBrandedClicks: number;
    brandedImpressions: number;
    nonBrandedImpressions: number;
  } | null;
  topQueries: GscQueryRow[];
  topNonBrandedQueries: GscQueryRow[];
  topPages: GscPageRow[];
  topCountries: GscCountryRow[];
  sitemaps: Array<{
    path: string;
    lastSubmitted?: string | null;
    lastDownloaded?: string | null;
    isPending?: boolean;
    warnings?: number;
    errors?: number;
  }>;
}

const BRANDED_TERMS = [
  'sufipulse',
  'sufi pulse',
  'sufitube',
  'sufi tube',
  'zarf-e-noori',
  'zarf e noori',
  'dr. fayaz',
];

function isBrandedQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  return BRANDED_TERMS.some((term) => q.includes(term));
}

function resolveGscAuthConfig(): {
  property: string | null;
  authMode: GscStatusSnapshot['authMode'];
  missingRequirements: string[];
  createClient: (() => Promise<any>) | null;
} {
  const property = (process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || '').trim() || null;
  const serviceAccountFile = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  const serviceAccountJson = (process.env.GSC_SERVICE_ACCOUNT_JSON || '').trim();
  const gscClientId = (process.env.GSC_CLIENT_ID || '').trim();
  const gscClientSecret = (process.env.GSC_CLIENT_SECRET || '').trim();
  const gscRefreshToken = (process.env.GSC_REFRESH_TOKEN || '').trim();

  const missing: string[] = [];
  if (!property) {
    missing.push('GOOGLE_SEARCH_CONSOLE_PROPERTY (e.g., sc-domain:sufipulse.com or https://sufipulse.com/)');
  }

  const scopes = [
    'https://www.googleapis.com/auth/webmasters',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ];

  if (serviceAccountFile && fs.existsSync(serviceAccountFile)) {
    return {
      property,
      authMode: 'service_account_file',
      missingRequirements: missing,
      createClient: async () => {
        const auth = new google.auth.GoogleAuth({ keyFile: serviceAccountFile, scopes });
        return auth.getClient();
      },
    };
  }

  if (serviceAccountJson) {
    return {
      property,
      authMode: 'service_account_json',
      missingRequirements: missing,
      createClient: async () => {
        const credentials = JSON.parse(serviceAccountJson);
        const auth = new google.auth.GoogleAuth({ credentials, scopes });
        return auth.getClient();
      },
    };
  }

  if (gscClientId && gscClientSecret && gscRefreshToken) {
    return {
      property,
      authMode: 'oauth_refresh_token',
      missingRequirements: missing,
      createClient: async () => {
        const oauth2 = new google.auth.OAuth2(gscClientId, gscClientSecret);
        oauth2.setCredentials({ refresh_token: gscRefreshToken });
        return oauth2;
      },
    };
  }

  missing.push(
    'GSC API credentials: set GOOGLE_APPLICATION_CREDENTIALS (Service Account JSON path), GSC_SERVICE_ACCOUNT_JSON, or GSC_CLIENT_ID + GSC_CLIENT_SECRET + GSC_REFRESH_TOKEN'
  );

  return {
    property,
    authMode: 'none',
    missingRequirements: missing,
    createClient: null,
  };
}

export async function getGoogleSearchConsoleStatus(): Promise<GscStatusSnapshot> {
  const cfg = resolveGscAuthConfig();
  const now = new Date().toISOString();
  const setupInstructions = [
    '1. Verify sc-domain:sufipulse.com (or https://sufipulse.com/) in Google Search Console.',
    '2. Create a Google Cloud Service Account (with Search Console API enabled) and grant it Owner/Full permission on the Search Console property.',
    '3. Set GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:sufipulse.com and GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json (or GSC_SERVICE_ACCOUNT_JSON) in .env.local / VPS .env.',
  ];

  if (!cfg.property || !cfg.createClient) {
    return {
      state: 'NOT_CONFIGURED',
      configured: false,
      property: cfg.property,
      authMode: cfg.authMode,
      siteVerifiedInAccount: false,
      permissionLevel: null,
      lastCheckedAt: now,
      errorMessage: null,
      missingRequirements: cfg.missingRequirements,
      setupInstructions,
    };
  }

  try {
    const authClient = await cfg.createClient();
    const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
    const sitesRes = await searchconsole.sites.list();
    const entries = sitesRes.data.siteEntry || [];
    const matched = entries.find(
      (s) =>
        s.siteUrl === cfg.property ||
        s.siteUrl?.replace(/\/+$/, '') === cfg.property?.replace(/\/+$/, '')
    );

    if (!matched) {
      return {
        state: 'CONFIGURED_UNVERIFIED',
        configured: true,
        property: cfg.property,
        authMode: cfg.authMode,
        siteVerifiedInAccount: false,
        permissionLevel: null,
        lastCheckedAt: now,
        errorMessage: `Authenticated with Google Search Console API, but property "${cfg.property}" was not found in authorized sites (${entries.length} visible). Grant property access to the configured credential.`,
        missingRequirements: [],
        setupInstructions,
      };
    }

    return {
      state: 'CONNECTED',
      configured: true,
      property: matched.siteUrl || cfg.property,
      authMode: cfg.authMode,
      siteVerifiedInAccount: matched.permissionLevel !== 'siteUnverifiedUser',
      permissionLevel: matched.permissionLevel || null,
      lastCheckedAt: now,
      errorMessage: null,
      missingRequirements: [],
      setupInstructions: [],
    };
  } catch (err: any) {
    return {
      state: 'ERROR',
      configured: true,
      property: cfg.property,
      authMode: cfg.authMode,
      siteVerifiedInAccount: false,
      permissionLevel: null,
      lastCheckedAt: now,
      errorMessage: err?.message || 'Google Search Console API request failed.',
      missingRequirements: [],
      setupInstructions,
    };
  }
}

export async function getGoogleSearchConsoleReport(days = 28): Promise<GscSearchAnalyticsReport> {
  const end = new Date();
  // GSC data typically has a 2-day processing lag
  const endDateObj = new Date(end.getTime() - 2 * 86400 * 1000);
  const startDateObj = new Date(endDateObj.getTime() - (days - 1) * 86400 * 1000);
  const startDate = startDateObj.toISOString().split('T')[0];
  const endDate = endDateObj.toISOString().split('T')[0];
  const fetchedAt = new Date().toISOString();

  const status = await getGoogleSearchConsoleStatus();
  if (status.state !== 'CONNECTED' || !status.property) {
    return {
      status: status.state,
      property: status.property,
      period: { startDate, endDate },
      fetchedAt,
      errorMessage: status.errorMessage,
      totals: null,
      topQueries: [],
      topNonBrandedQueries: [],
      topPages: [],
      topCountries: [],
      sitemaps: [],
    };
  }

  try {
    const cfg = resolveGscAuthConfig();
    const authClient = await cfg.createClient!();
    const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });

    const [queriesRes, pagesRes, countriesRes, sitemapsRes] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl: status.property,
        requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 50 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl: status.property,
        requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 30 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl: status.property,
        requestBody: { startDate, endDate, dimensions: ['country'], rowLimit: 25 },
      }),
      searchconsole.sitemaps.list({ siteUrl: status.property }).catch(() => ({ data: { sitemap: [] } })),
    ]);

    const topQueries: GscQueryRow[] = (queriesRes.data.rows || []).map((r) => {
      const query = String(r.keys?.[0] || '');
      return {
        query,
        clicks: Number(r.clicks || 0),
        impressions: Number(r.impressions || 0),
        ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
        position: Number((r.position || 0).toFixed(1)),
        intentType: isBrandedQuery(query) ? 'branded' : 'non_branded',
      };
    });

    const topPages: GscPageRow[] = (pagesRes.data.rows || []).map((r) => ({
      page: String(r.keys?.[0] || ''),
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1)),
    }));

    const topCountries: GscCountryRow[] = (countriesRes.data.rows || []).map((r) => ({
      countryCode: String(r.keys?.[0] || '').toUpperCase(),
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
      position: Number((r.position || 0).toFixed(1)),
    }));

    const totalClicks = topQueries.reduce((s, q) => s + q.clicks, 0);
    const totalImpressions = topQueries.reduce((s, q) => s + q.impressions, 0);
    const brandedClicks = topQueries.filter((q) => q.intentType === 'branded').reduce((s, q) => s + q.clicks, 0);
    const nonBrandedClicks = totalClicks - brandedClicks;
    const brandedImpressions = topQueries.filter((q) => q.intentType === 'branded').reduce((s, q) => s + q.impressions, 0);
    const nonBrandedImpressions = totalImpressions - brandedImpressions;
    const weightedPos =
      totalImpressions > 0
        ? Number((topQueries.reduce((s, q) => s + q.position * q.impressions, 0) / totalImpressions).toFixed(1))
        : 0;

    return {
      status: 'CONNECTED',
      property: status.property,
      period: { startDate, endDate },
      fetchedAt,
      errorMessage: null,
      totals: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
        avgPosition: weightedPos,
        brandedClicks,
        nonBrandedClicks,
        brandedImpressions,
        nonBrandedImpressions,
      },
      topQueries: topQueries.slice(0, 25),
      topNonBrandedQueries: topQueries.filter((q) => q.intentType === 'non_branded').slice(0, 20),
      topPages,
      topCountries,
      sitemaps: (sitemapsRes.data.sitemap || []).map((sm: any) => ({
        path: sm.path || '',
        lastSubmitted: sm.lastSubmitted || null,
        lastDownloaded: sm.lastDownloaded || null,
        isPending: Boolean(sm.isPending),
        warnings: Number(sm.warnings || 0),
        errors: Number(sm.errors || 0),
      })),
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      property: status.property,
      period: { startDate, endDate },
      fetchedAt,
      errorMessage: err?.message || 'Failed to query Google Search Console Search Analytics.',
      totals: null,
      topQueries: [],
      topNonBrandedQueries: [],
      topPages: [],
      topCountries: [],
      sitemaps: [],
    };
  }
}

export async function submitSitemapToGoogleSearchConsole(triggeredBy = 'admin') {
  const sitemapUrl = `${CANONICAL_ORIGIN}/sitemap.xml`;
  const status = await getGoogleSearchConsoleStatus();
  if (status.state !== 'CONNECTED' || !status.property) {
    appendIndexingEntry({
      url: sitemapUrl,
      protocol: 'gsc_sitemap',
      state: 'NOT_CONFIGURED',
      httpStatus: null,
      responseSummary: status.errorMessage || 'Google Search Console property/credentials are not configured.',
      errorMessage: status.missingRequirements.join('; ') || status.errorMessage,
      triggeredBy,
    });
    return {
      success: false,
      state: status.state,
      message: status.errorMessage || 'Google Search Console is NOT CONFIGURED.',
    };
  }

  try {
    const cfg = resolveGscAuthConfig();
    const authClient = await cfg.createClient!();
    const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
    const res = await searchconsole.sitemaps.submit({
      siteUrl: status.property,
      feedpath: sitemapUrl,
    });
    appendIndexingEntry({
      url: sitemapUrl,
      protocol: 'gsc_sitemap',
      state: 'SUBMISSION_ACCEPTED',
      httpStatus: res.status || 200,
      responseSummary: `Submitted ${sitemapUrl} to Google Search Console property ${status.property}.`,
      triggeredBy,
    });
    return {
      success: true,
      state: 'SUBMISSION_ACCEPTED',
      message: `Sitemap submitted to Google Search Console (${status.property}).`,
    };
  } catch (err: any) {
    appendIndexingEntry({
      url: sitemapUrl,
      protocol: 'gsc_sitemap',
      state: 'SUBMISSION_FAILED',
      httpStatus: err?.code || null,
      responseSummary: `GSC sitemap submission failed: ${err?.message || 'unknown error'}`,
      errorMessage: err?.message || 'unknown error',
      triggeredBy,
    });
    return {
      success: false,
      state: 'SUBMISSION_FAILED',
      message: err?.message || 'GSC sitemap submission failed.',
    };
  }
}

export async function inspectUrlInGoogleSearchConsole(inspectionUrl: string, triggeredBy = 'admin') {
  const status = await getGoogleSearchConsoleStatus();
  if (status.state !== 'CONNECTED' || !status.property) {
    return {
      configured: false,
      state: status.state,
      verdict: null,
      coverageState: null,
      lastCrawlTime: null,
      googleCanonical: null,
      message: status.errorMessage || 'Google Search Console URL Inspection API is NOT CONFIGURED.',
    };
  }

  try {
    const cfg = resolveGscAuthConfig();
    const authClient = await cfg.createClient!();
    const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl,
        siteUrl: status.property,
      },
    });

    const idxResult = res.data.inspectionResult?.indexStatusResult;
    const isIndexed = idxResult?.verdict === 'PASS';

    appendIndexingEntry({
      url: inspectionUrl,
      protocol: 'gsc_url_inspection',
      state: isIndexed ? 'INDEXED_VERIFIED' : 'SUBMISSION_ACCEPTED',
      httpStatus: res.status || 200,
      responseSummary: `GSC URL Inspection verdict=${idxResult?.verdict || 'UNKNOWN'} (${idxResult?.coverageState || 'n/a'})`,
      triggeredBy,
    });

    return {
      configured: true,
      state: isIndexed ? 'INDEXED_VERIFIED' : 'INSPECTED_NOT_INDEXED',
      verdict: idxResult?.verdict || null,
      coverageState: idxResult?.coverageState || null,
      lastCrawlTime: idxResult?.lastCrawlTime || null,
      googleCanonical: idxResult?.googleCanonical || null,
      message: idxResult?.coverageState || 'URL inspected via Google Search Console API.',
    };
  } catch (err: any) {
    return {
      configured: true,
      state: 'ERROR',
      verdict: null,
      coverageState: null,
      lastCrawlTime: null,
      googleCanonical: null,
      message: err?.message || 'URL Inspection API call failed.',
    };
  }
}
