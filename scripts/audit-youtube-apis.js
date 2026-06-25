const fs = require('fs');
const path = require('path');
const https = require('https');

const ENV_PATH = path.join(__dirname, '..', '.env.local');
const HARDCODED_KEY = 'AIzaSyCw34bUCxl_8S5R8I-380YyFOLDqpWL-R4';

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Env file not found at: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) continue;
    const key = trimmed.substring(0, firstEq).trim();
    let val = trimmed.substring(firstEq + 1).trim();
    // remove quotes if wrapped
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
  return env;
}

// Make a generic fetch helper using Node's standard https module
function makeRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function audit() {
  console.log('==================================================');
  console.log('🔍 YOUTUBE API AUDIT & DIAGNOSTIC RUN');
  console.log('==================================================\n');
  
  const env = parseEnv(ENV_PATH);
  
  const channelId = env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
  const envApiKey = env.YOUTUBE_API_KEY || env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const clientId = env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = env.YOUTUBE_REFRESH_TOKEN;
  
  console.log(`Channel ID: ${channelId}`);
  console.log(`Env API Key: ${envApiKey ? envApiKey.substring(0, 10) + '...' : '❌ Missing'}`);
  console.log(`Hardcoded Key: ${HARDCODED_KEY.substring(0, 10) + '...'}`);
  console.log(`OAuth Client ID: ${clientId ? clientId.substring(0, 15) + '...' : '❌ Missing'}`);
  console.log(`OAuth Client Secret: ${clientSecret ? '***' : '❌ Missing'}`);
  console.log(`OAuth Refresh Token: ${refreshToken ? refreshToken.substring(0, 15) + '...' : '❌ Missing'}\n`);
  
  const results = {
    envApiKey: { status: 'Untested', message: '', details: null },
    hardcodedApiKey: { status: 'Untested', message: '', details: null },
    tokenRefresh: { status: 'Untested', message: '', details: null },
    oauthApiCall: { status: 'Untested', message: '', details: null }
  };
  
  // Test 1: Env API Key
  if (envApiKey) {
    console.log('🧪 Test 1: Testing YOUTUBE_API_KEY from .env.local...');
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=1&type=video&key=${envApiKey}`;
    try {
      const res = await makeRequest(url);
      if (res.status === 200 && !res.data.error) {
        results.envApiKey.status = 'WORKING';
        results.envApiKey.message = `Successfully fetched videos! First video title: "${res.data.items?.[0]?.snippet?.title || 'No videos found'}"`;
        console.log('✅ Success!');
      } else {
        results.envApiKey.status = 'FAILED';
        results.envApiKey.message = res.data.error?.message || `HTTP ${res.status}`;
        results.envApiKey.details = res.data.error;
        console.log(`❌ Failed: ${results.envApiKey.message}`);
      }
    } catch (e) {
      results.envApiKey.status = 'ERROR';
      results.envApiKey.message = e.message;
      console.log(`❌ Error: ${e.message}`);
    }
  } else {
    results.envApiKey.status = 'MISSING';
    results.envApiKey.message = 'No YOUTUBE_API_KEY in .env.local';
    console.log('⚠️ Test 1 Skipped: Key missing');
  }
  console.log('');
  
  // Test 2: Hardcoded API Key
  console.log('🧪 Test 2: Testing hardcoded API Key (AIzaSyCw34bUCxl_8S5R8I-380Yy...)....');
  const urlHardcoded = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=1&type=video&key=${HARDCODED_KEY}`;
  try {
    const res = await makeRequest(urlHardcoded);
    if (res.status === 200 && !res.data.error) {
      results.hardcodedApiKey.status = 'WORKING';
      results.hardcodedApiKey.message = `Successfully fetched videos! First video title: "${res.data.items?.[0]?.snippet?.title || 'No videos found'}"`;
      console.log('✅ Success!');
    } else {
      results.hardcodedApiKey.status = 'FAILED';
      results.hardcodedApiKey.message = res.data.error?.message || `HTTP ${res.status}`;
      results.hardcodedApiKey.details = res.data.error;
      console.log(`❌ Failed: ${results.hardcodedApiKey.message}`);
    }
  } catch (e) {
    results.hardcodedApiKey.status = 'ERROR';
    results.hardcodedApiKey.message = e.message;
    console.log(`❌ Error: ${e.message}`);
  }
  console.log('');
  
  // Test 3: OAuth Token Refresh
  let newAccessToken = null;
  if (clientId && clientSecret && refreshToken) {
    console.log('🧪 Test 3: Attempting to refresh OAuth token...');
    const refreshUrl = 'https://oauth2.googleapis.com/token';
    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    try {
      const res = await makeRequest(
        refreshUrl,
        'POST',
        { 'Content-Type': 'application/x-www-form-urlencoded' },
        bodyParams.toString()
      );
      
      if (res.status === 200 && res.data.access_token) {
        newAccessToken = res.data.access_token;
        results.tokenRefresh.status = 'WORKING';
        results.tokenRefresh.message = `Successfully refreshed! New access token starts with: "${newAccessToken.substring(0, 8)}..." (expires in ${res.data.expires_in}s)`;
        console.log('✅ Success!');
      } else {
        results.tokenRefresh.status = 'FAILED';
        results.tokenRefresh.message = res.data.error_description || res.data.error || `HTTP ${res.status}`;
        results.tokenRefresh.details = res.data;
        console.log(`❌ Failed: ${results.tokenRefresh.message}`);
      }
    } catch (e) {
      results.tokenRefresh.status = 'ERROR';
      results.tokenRefresh.message = e.message;
      console.log(`❌ Error: ${e.message}`);
    }
  } else {
    results.tokenRefresh.status = 'MISSING';
    results.tokenRefresh.message = 'Missing OAuth configuration (Client ID, Secret, or Refresh Token) in .env.local';
    console.log('⚠️ Test 3 Skipped: Missing OAuth config');
  }
  console.log('');
  
  // Test 4: Authenticated API call with refreshed token
  if (newAccessToken) {
    console.log('🧪 Test 4: Testing YouTube API access with new Access Token...');
    // We can use the Access Token to get channel details
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}`;
    try {
      const res = await makeRequest(channelUrl, 'GET', {
        'Authorization': `Bearer ${newAccessToken}`
      });
      if (res.status === 200 && !res.data.error) {
        results.oauthApiCall.status = 'WORKING';
        const channelTitle = res.data.items?.[0]?.snippet?.title || 'Unknown';
        const viewCount = res.data.items?.[0]?.statistics?.viewCount || '0';
        results.oauthApiCall.message = `Successfully fetched channel detail using refreshed OAuth token! Channel: "${channelTitle}", total views: ${viewCount}`;
        console.log('✅ Success!');
      } else {
        results.oauthApiCall.status = 'FAILED';
        results.oauthApiCall.message = res.data.error?.message || `HTTP ${res.status}`;
        results.oauthApiCall.details = res.data.error;
        console.log(`❌ Failed: ${results.oauthApiCall.message}`);
      }
    } catch (e) {
      results.oauthApiCall.status = 'ERROR';
      results.oauthApiCall.message = e.message;
      console.log(`❌ Error: ${e.message}`);
    }
  } else {
    results.oauthApiCall.status = 'SKIPPED';
    results.oauthApiCall.message = 'No active access token available (refresh step failed or skipped)';
    console.log('⚠️ Test 4 Skipped: No access token');
  }
  console.log('');
  
  // Generate Markdown report
  console.log('Generating JSON report for Antigravity...');
  const report = {
    channelId,
    timestamp: new Date().toISOString(),
    results
  };
  fs.writeFileSync(path.join(__dirname, '..', 'scripts', 'youtube-audit-report.json'), JSON.stringify(report, null, 2));
  console.log('✅ Done! Report saved to scripts/youtube-audit-report.json');
}

audit().catch(console.error);
