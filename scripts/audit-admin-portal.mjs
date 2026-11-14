import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 1. Extract JWT Secret
const envPath = path.join(process.cwd(), '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
let jwtSecret = '';
for (const line of envText.split('\n')) {
  if (line.startsWith('JWT_SECRET=')) {
    jwtSecret = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
    break;
  }
}

if (!jwtSecret) {
  console.error('Could not find JWT_SECRET in .env.local');
  process.exit(1);
}

// 2. Generate Admin Token
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = {
  userId: '1785047409044-jc5kaobzu',
  email: 'fk.envcal@gmail.com',
  role: 'admin',
  iat: now,
  exp: now + 3600 * 24 * 7,
  jti: 'audit-' + Date.now(),
};

const encodedHeader = base64UrlEncode(JSON.stringify(header));
const encodedPayload = base64UrlEncode(JSON.stringify(payload));
const signature = crypto
  .createHmac('sha256', jwtSecret)
  .update(encodedHeader + '.' + encodedPayload)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const token = `${encodedHeader}.${encodedPayload}.${signature}`;
const cookieHeader = `access_token=${token}`;

const BASE_URL = 'http://localhost:3005';

// 3. Define Admin Pages to Audit
const adminPages = [
  // Core
  { url: '/admin', title: 'Admin Overview' },
  { url: '/admin/users', title: 'User Management' },

  // Stage 1: Onboarding & Applications
  { url: '/admin/applications/writers', title: 'Writers (Ahl-e-Qalam)' },
  { url: '/admin/applications/vocalists', title: 'Vocalists (Ahl-e-Sada)' },
  { url: '/admin/applications/producers', title: 'Producers (Ahl-e-Naghma)' },
  { url: '/admin/applications/literary', title: 'Literary (Ahl-e-Tahreer)' },
  { url: '/admin/applications/studio', title: 'Studios (Karkhana-e-Sada)' },
  { url: '/admin/studio-access-codes', title: 'Studio Access Codes' },

  // Stage 2: Content
  { url: '/admin/kalams', title: 'Kalam Editorial Queue' },
  { url: '/admin/sadas', title: 'Sadas (Vocal Tracks)' },
  { url: '/admin/articles', title: 'Articles (Ahl-e-Tahreer)' },
  { url: '/admin/lyrics-requests', title: 'Lyrics Requests' },
  { url: '/admin/performance-assignments', title: 'Performance Assignments' },

  // Stage 3: Production & Studio
  { url: '/admin/pipeline', title: 'Hybrid Studio Pipeline' },
  { url: '/admin/pipeline/draft_1794685095942_19d6bbbe', title: 'Review Cockpit (Rab Ki Tasbeeh)' },
  { url: '/admin/pipeline/draft_1794685665449_82f0a96e', title: 'Review Cockpit (Rabb Meri Raah Khol De)' },
  { url: '/admin/production-queue', title: 'Studio Production Queue' },
  { url: '/admin/studio-settings/private-production', title: 'Studio Audio Settings' },
  { url: '/admin/editorial/production-consideration', title: 'Production Consideration' },
  { url: '/admin/production-workflow', title: 'Production Workflow' },
  { url: '/admin/session-requests', title: 'Session Requests' },
  { url: '/admin/studio-sessions', title: 'Studio Sessions' },
  { url: '/admin/release-workflow', title: 'Release Workflow' },
  { url: '/admin/cms', title: 'CMS Dashboard' },
  { url: '/admin/cms/releases', title: 'CMS Releases List' },
  { url: '/admin/cms/media', title: 'CMS Media Library' },
  { url: '/admin/cms/roles', title: 'CMS Role Assignments' },
  { url: '/admin/cms/bulk-import', title: 'CMS Bulk Import' },
  { url: '/admin/cms-releases', title: 'CMS Releases (Main)' },
  { url: '/admin/cms-releases/new', title: 'CMS Release Creation' },
  { url: '/admin/youtube-release-candidates', title: 'YouTube Release Approvals' },
  { url: '/admin/youtube-sync', title: 'YouTube Sync Ops' },
  { url: '/admin/registries', title: 'Master Registries' },
  { url: '/admin/discovery-graph', title: 'Discovery Graph' },
  { url: '/admin/discovery-performance', title: 'Discovery Performance' },
  { url: '/admin/discovery-mission', title: 'Discovery Mission Ops' },
  { url: '/admin/knowledge-registry', title: 'Knowledge Registry' },
  { url: '/admin/metadata-authority', title: 'Metadata Authority' },
  { url: '/admin/atlas/flagships', title: 'Atlas Flagships' },
  { url: '/admin/atlas/graph', title: 'Atlas Knowledge Graph' },

  // Stage 4: Outreach & Finance
  { url: '/admin/song-adoptions', title: 'Song Adoptions' },
  { url: '/admin/youtube-analytics', title: 'YouTube Impressions / Analytics' },
  { url: '/admin/google-ads', title: 'Google Ads Campaigns' },
  { url: '/admin/partnerships', title: 'Partnerships' },
  { url: '/admin/infrastructure', title: 'Infrastructure Proposals' },
  { url: '/admin/contact-messages', title: 'Contact Messages' },
  { url: '/admin/inquiries', title: 'Public Inquiries' },
  { url: '/admin/royalties', title: 'Royalty Management' },
  { url: '/admin/auto-setup', title: 'Auto-Setup Center' },
  { url: '/admin/setup', title: 'System Diagnostics & Setup' },
];

// 4. Define Key Admin APIs to Audit (matching actual page fetch URLs)
const adminApis = [
  { url: '/api/admin/pipeline/drafts', method: 'GET', desc: 'List Pipeline Drafts' },
  { url: '/api/admin/pipeline/drafts/draft_1794685095942_19d6bbbe', method: 'GET', desc: 'Draft Rab Ki Tasbeeh Data' },
  { url: '/api/admin/pipeline/drafts/draft_1794685665449_82f0a96e', method: 'GET', desc: 'Draft Rabb Meri Raah Khol De Data' },
  { url: '/api/admin/pipeline/drafts/draft_1794685665449_82f0a96e/media?asset=master_video&format=lyric_master', method: 'GET', desc: '1080p Video Stream (Lyric Master)' },
  { url: '/api/admin/pipeline/drafts/draft_1794685665449_82f0a96e/media?asset=master_audio', method: 'GET', desc: 'Master Audio WAV Stream' },
  { url: '/api/admin/users', method: 'GET', desc: 'Admin User Management API' },
  { url: '/api/writers', method: 'GET', desc: 'Writers Applications API' },
  { url: '/api/vocalists', method: 'GET', desc: 'Vocalists Applications API' },
  { url: '/api/producers', method: 'GET', desc: 'Producers Applications API' },
  { url: '/api/literary', method: 'GET', desc: 'Literary Applications API' },
  { url: '/api/studio', method: 'GET', desc: 'Studios Applications API' },
  { url: '/api/studio-access-codes', method: 'GET', desc: 'Studio Access Codes API' },
  { url: '/api/kalams', method: 'GET', desc: 'Kalam Queue API' },
  { url: '/api/sadas', method: 'GET', desc: 'Sadas API' },
  { url: '/api/articles', method: 'GET', desc: 'Articles API' },
  { url: '/api/royalties', method: 'GET', desc: 'Royalties API' },
  { url: '/api/adoptions?all=1', method: 'GET', desc: 'Song Adoptions API' },
  { url: '/api/admin/google-ads/campaign-requests', method: 'GET', desc: 'Google Ads Campaign Requests API' },
  { url: '/api/releases', method: 'GET', desc: 'Catalog Releases API' },
  { url: '/api/releases/youtube-candidates', method: 'GET', desc: 'YouTube Release Candidates API' },
  { url: '/api/admin/graph', method: 'GET', desc: 'Discovery Graph API' },
  { url: '/api/admin/registries', method: 'GET', desc: 'Master Registries API' },
];

async function runAudit() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('      SufiPulse Portal Governance: Complete Admin Audit        ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Authenticated Admin: fk.envcal@gmail.com (id: 1785047409044-jc5kaobzu)\n`);

  let pagePass = 0;
  let pageFail = 0;
  const pageErrors = [];

  console.log('--- Phase 1: Auditing Admin Pages & Navigation Routes ---');
  for (const p of adminPages) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${p.url}`, {
        headers: {
          Cookie: cookieHeader,
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'manual',
      });
      const duration = Date.now() - t0;
      const status = res.status;

      // Status 200 is healthy. 307/308 redirect can be healthy if intentional. 404 / 500 is error.
      if (status === 200 || status === 307 || status === 308) {
        const text = await res.text();
        // Check for Next.js internal crash screens in 200 response
        if (text.includes('Application error: a client-side exception has occurred') || text.includes('Internal Server Error')) {
          pageFail++;
          pageErrors.push({ url: p.url, title: p.title, status, error: 'Contains Internal Server Error text' });
          console.log(`  ✖ FAIL [${status}] ${p.url} (${p.title}) - ${duration}ms [HTML Crash]`);
        } else {
          pagePass++;
          console.log(`  ✔ PASS [${status}] ${p.url} (${p.title}) - ${duration}ms`);
        }
      } else {
        pageFail++;
        pageErrors.push({ url: p.url, title: p.title, status, error: `HTTP ${status}` });
        console.log(`  ✖ FAIL [${status}] ${p.url} (${p.title}) - ${duration}ms`);
      }
    } catch (err) {
      pageFail++;
      pageErrors.push({ url: p.url, title: p.title, status: 0, error: err.message });
      console.log(`  ✖ FAIL [ERR] ${p.url} (${p.title}) - ${err.message}`);
    }
  }

  console.log(`\n--- Phase 2: Auditing Core Admin API Endpoints ---`);
  let apiPass = 0;
  let apiFail = 0;
  const apiErrors = [];

  for (const a of adminApis) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${a.url}`, {
        method: a.method,
        headers: {
          Cookie: cookieHeader,
          Accept: '*/*',
        },
      });
      const duration = Date.now() - t0;
      const status = res.status;

      if (status === 200 || status === 206) {
        apiPass++;
        console.log(`  ✔ PASS [${status}] ${a.method} ${a.url} (${a.desc}) - ${duration}ms`);
      } else {
        apiFail++;
        apiErrors.push({ url: a.url, desc: a.desc, status, error: `HTTP ${status}` });
        console.log(`  ✖ FAIL [${status}] ${a.method} ${a.url} (${a.desc}) - ${duration}ms`);
      }
    } catch (err) {
      apiFail++;
      apiErrors.push({ url: a.url, desc: a.desc, status: 0, error: err.message });
      console.log(`  ✖ FAIL [ERR] ${a.method} ${a.url} (${a.desc}) - ${err.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        AUDIT SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Admin Pages Checked: ${pagePass + pageFail} | Passed: ${pagePass} | Failed: ${pageFail}`);
  console.log(`Admin APIs Checked:  ${apiPass + apiFail} | Passed: ${apiPass} | Failed: ${apiFail}`);
  console.log(`Overall Health:      ${pageFail + apiFail === 0 ? '100% OPERATIONAL' : 'ACTION REQUIRED'}`);

  if (pageErrors.length > 0 || apiErrors.length > 0) {
    console.log('\nErrors detected:');
    for (const e of [...pageErrors, ...apiErrors]) {
      console.log(`  - [${e.status}] ${e.url} (${e.title || e.desc}): ${e.error}`);
    }
  }
}

runAudit().catch(console.error);
