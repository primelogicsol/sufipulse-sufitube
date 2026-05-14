const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'fk.envcal@gmail.com';
const ADMIN_PASSWORD = 'Susan7861%';

async function test() {
    console.log('--- Testing Direct Import API ---');

    // 1. Login
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    const cookies = loginRes.headers.get('set-cookie');
    if (!cookies) {
        console.error('Login failed, no cookies received');
        return;
    }

    const videoId = 'q58mRXIsi-Y';
    console.log(`Attempting to import: ${videoId}`);

    const res = await fetch(`${BASE}/api/releases/import-youtube`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookies
        },
        body: JSON.stringify({ videoIds: [videoId] })
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
}

test();
