/**
 * Simulate a Stripe webhook PATCH to set paymentStatus=paid on an adoption.
 * Uses STRIPE_WEBHOOK_SECRET from local .env.local — same value deployed on VPS.
 * No secret is printed to stdout.
 *
 * Usage: node scripts/webhook-simulate.mjs <adoption_id> <session_id> <amount>
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const [,, adoptionId, sessionId, amount = '75'] = process.argv;
if (!adoptionId || !sessionId) {
  console.error('Usage: node webhook-simulate.mjs <adoption_id> <session_id> [amount]');
  process.exit(1);
}

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
const envContents = readFileSync(envPath, 'utf8');
const match = envContents.match(/^STRIPE_WEBHOOK_SECRET=(.+)$/m);
if (!match) {
  console.error('STRIPE_WEBHOOK_SECRET not found in .env.local — cannot simulate webhook');
  process.exit(1);
}
const webhookSecret = match[1].trim();

if (!webhookSecret.startsWith('whsec_')) {
  console.error('STRIPE_WEBHOOK_SECRET does not look like a valid webhook secret');
  process.exit(1);
}

console.log(`\nSimulating Stripe webhook PATCH for adoption ${adoptionId}...`);

const res = await fetch(`https://sufipulse.com/api/adoptions/${adoptionId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': webhookSecret,
  },
  body: JSON.stringify({
    payment_status: 'paid',
    adoption_status: 'admin_review',
    amount_paid: Number(amount),
    stripe_session_id: sessionId,
    event_type: 'checkout.session.completed',
  }),
});

const data = await res.json();
console.log(`  HTTP ${res.status}:`, JSON.stringify(data, null, 2));

if (res.ok) {
  // Verify the adoption record was updated
  console.log('\nVerifying adoption record...');
  const adoptionRes = await fetch(`https://sufipulse.com/api/adoptions/${adoptionId}`);
  const adoption = await adoptionRes.json();
  console.log(`  adoptionStatus: ${adoption.adoptionStatus}`);
  console.log(`  paymentStatus:  ${adoption.paymentStatus}`);
  console.log(`  amountPaid:     ${adoption.amountPaid}`);

  if (adoption.paymentStatus === 'paid' && adoption.adoptionStatus === 'admin_review') {
    console.log('\n✓ PASS: paymentStatus=paid, adoptionStatus=admin_review');
  } else {
    console.log('\n✗ FAIL: unexpected state after webhook simulation');
    process.exit(1);
  }
} else {
  console.error('\nWebhook PATCH failed — VPS may have a different STRIPE_WEBHOOK_SECRET');
  process.exit(1);
}
