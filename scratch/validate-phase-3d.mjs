const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'fk.envcal@gmail.com';
const ADMIN_PASSWORD = 'Susan7861%';

async function validate() {
  console.log('--- Phase 3D Final Validation ---');
  
  try {
    // 1. Login
    console.log('1. Logging in as admin...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    
    const cookie = loginRes.headers.get('set-cookie');
    console.log('   ✓ Login successful');

    // 2. Test Status API (Matrix)
    console.log('2. Testing /api/admin/google-ads/status...');
    const statusRes = await fetch(`${BASE_URL}/api/admin/google-ads/status`, {
      headers: { 'Cookie': cookie }
    });
    const statusData = await statusRes.json();
    
    console.log('   Status:', statusRes.status);
    console.log('   Studio Connected:', statusData.studioAccount?.connected);
    if (statusData.studioAccount?.verification) {
      const v = statusData.studioAccount.verification;
      console.log('   Matrix - OAuth Valid:', v.oauth.valid);
      console.log('   Matrix - Account Accessible:', v.account.accessible);
      console.log('   Matrix - Account Error:', v.account.error || 'None');
    }

    // 3. Test Hierarchy API
    console.log('3. Testing /api/admin/google-ads/hierarchy...');
    const hierarchyRes = await fetch(`${BASE_URL}/api/admin/google-ads/hierarchy`, {
      headers: { 'Cookie': cookie }
    });
    const hierarchyData = await hierarchyRes.json();
    
    console.log('   Status:', hierarchyRes.status);
    console.log('   Accounts Count:', hierarchyData.accounts?.length || 0);

    // 4. Verify Public Quarantine
    console.log('4. Verifying Public Quarantine...');
    const publicRes = await fetch(`${BASE_URL}/release-detail/the-silence-between-two-breaths`);
    const publicHtml = await publicRes.text();
    
    const isQuarantined = publicHtml.includes('Google Ads Direct is undergoing infrastructure enhancement');
    const isButtonHidden = !publicHtml.includes('Connect Google Ads Account');
    
    console.log('   Message Correct:', isQuarantined);
    console.log('   Button Hidden:', isButtonHidden);

    console.log('\n--- Validation Summary ---');
    console.log('Status API Matrix: ' + (statusData.studioAccount?.connected ? 'PASS' : 'FAIL'));
    console.log('Hierarchy API: ' + (hierarchyRes.ok ? 'PASS' : 'FAIL'));
    console.log('Public Quarantine: ' + (isQuarantined && isButtonHidden ? 'PASS' : 'FAIL'));

  } catch (err) {
    console.error('\n✘ VALIDATION ERROR:', err.message);
  }
}

validate();
