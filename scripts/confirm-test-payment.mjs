/**
 * Programmatically complete a Stripe test-mode checkout session
 * using the test card pm_card_visa, then call /confirm on the adoption.
 *
 * Usage: node scripts/confirm-test-payment.mjs <session_id> <adoption_id> [cookie_file]
 */
import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const [,, sessionId, adoptionId, cookieFile] = process.argv;
if (!sessionId || !adoptionId) {
  console.error('Usage: node confirm-test-payment.mjs <cs_test_...> <adoption_id> [cookie_file]');
  process.exit(1);
}

// Load .env.local to get STRIPE_SECRET_KEY without exposing it
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
const envContents = readFileSync(envPath, 'utf8');
const match = envContents.match(/^STRIPE_SECRET_KEY=(.+)$/m);
if (!match) { console.error('STRIPE_SECRET_KEY not found in .env.local'); process.exit(1); }
const secretKey = match[1].trim();

if (!secretKey.startsWith('sk_test_')) {
  console.error(`ERROR: key starts with "${secretKey.slice(0,8)}..." — not a test key. Aborting.`);
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' });

async function run() {
  console.log(`\nRetrieving session ${sessionId}...`);
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });

  console.log(`  session.payment_status: ${session.payment_status}`);
  console.log(`  session.status: ${session.status}`);

  if (session.payment_status === 'paid') {
    console.log('  Already paid — calling /confirm...');
  } else {
    const pi = session.payment_intent;
    if (!pi || typeof pi === 'string') {
      console.error('  No payment_intent found on session'); process.exit(1);
    }
    console.log(`  payment_intent: ${pi.id}  status: ${pi.status}`);

    // Attach test card and confirm
    console.log('  Attaching pm_card_visa to payment_intent...');
    const confirmed = await stripe.paymentIntents.confirm(pi.id, {
      payment_method: 'pm_card_visa',
      return_url: 'https://sufipulse.com/adoption-success',
    });
    console.log(`  PaymentIntent status after confirm: ${confirmed.status}`);

    if (confirmed.status !== 'succeeded') {
      console.error(`  Unexpected PI status: ${confirmed.status}`);
      process.exit(1);
    }
  }

  // Now call /confirm on the adoption to sync server state
  console.log(`\nCalling POST /api/adoptions/${adoptionId}/confirm ...`);
  const cookieHeader = cookieFile
    ? readFileSync(cookieFile, 'utf8')
        .split('\n')
        .filter(l => l.includes('sufipulse') || l.includes('access_token') || l.includes('refresh_token'))
        .map(l => { const parts = l.split('\t'); return `${parts[5]}=${parts[6]}`; })
        .filter(Boolean)
        .join('; ')
    : '';

  const confirmRes = await fetch(
    `https://sufipulse.com/api/adoptions/${adoptionId}/confirm`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ session_id: sessionId }),
    }
  );

  const confirmData = await confirmRes.json();
  console.log(`  HTTP ${confirmRes.status}:`, JSON.stringify(confirmData, null, 2));

  // Fetch final adoption record to verify
  console.log(`\nFetching final adoption state...`);
  const adoptionRes = await fetch(`https://sufipulse.com/api/adoptions/${adoptionId}`);
  const adoption = await adoptionRes.json();
  console.log(`  adoptionStatus:  ${adoption.adoptionStatus}`);
  console.log(`  paymentStatus:   ${adoption.paymentStatus}`);
  console.log(`  amountPaid:      ${adoption.amountPaid}`);
  console.log(`  stripeSessionId: ${adoption.stripeSessionId || '(not returned in public view)'}`);
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
