/**
 * server/services/stripe.ts
 *
 * Stripe payment integration.
 * Config keys: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *
 * Usage:
 *   import { stripeClient, verifyWebhook } from '@/server/services/stripe';
 */

import Stripe from 'stripe';
import { config } from '@/server/config';

// Lazily created so the app starts fine even without STRIPE_SECRET_KEY set
let _stripe: Stripe | null = null;

export function stripeClient(): Stripe {
  if (!config.stripe.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!_stripe) {
    _stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2025-04-30.basil' });
  }
  return _stripe;
}

export async function verifyWebhook(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  if (!config.stripe.webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return stripeClient().webhooks.constructEventAsync(body, signature, config.stripe.webhookSecret);
}

export { Stripe };
