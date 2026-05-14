import 'dotenv/config';
import readline from 'readline';

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
// For Desktop Apps, the redirect URI is always this:
const redirectUri = 'http://localhost'; 

if (!clientId || !clientSecret) {
    console.error('❌ Error: YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET is missing in .env.local');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const SCOPE = 'https://www.googleapis.com/auth/yt-analytics.readonly';

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\n--- YouTube Refresh Token Generator (Desktop Flow) ---\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl.toString());
console.log('\n2. Sign in with the channel owner account.');
console.log('3. After you approve, you will see a page that says "The site cannot be reached" or similar.');
console.log('4. COPY the "code" parameter from the URL in your browser bar.');
console.log('   (Example: ?code=4/0Af...)\n');

rl.question('Paste the "code" here: ', async (code) => {
    try {
        console.log('\nExchanging code for tokens...');
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code.trim(),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('\n❌ Token exchange failed:', data.error_description || data.error);
        } else if (!data.refresh_token) {
            console.error('\n⚠️  No refresh token returned. Try revoking access at https://myaccount.google.com/permissions and try again.');
        } else {
            console.log('\n✅ Success! Your Refresh Token is:\n');
            console.log(data.refresh_token);
            console.log('\nAdd this to your .env.local and .env.production as YOUTUBE_REFRESH_TOKEN');
        }
    } catch (error) {
        console.error('\n❌ Error during exchange:', error.message);
    } finally {
        rl.close();
    }
});
