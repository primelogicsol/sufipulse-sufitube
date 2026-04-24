import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Test endpoint that throws an error to verify Sentry integration.
 * Access: GET /api/sentry-example-api
 */
export async function GET() {
  // This is a test endpoint — it intentionally throws an error
  // so you can verify that Sentry is capturing server-side errors.
  throw new Error("Sentry Example API Route Error — This is a test error for Sentry integration");
}
