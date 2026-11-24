import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  executeOptimizationDecision,
  syncOptimizationProposals,
} from '@/lib/discovery-optimization-loop';
import { brandRegistry } from '@/lib/brand-registry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await syncOptimizationProposals();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to sync optimization loop.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const actor = auth.email || auth.id || 'admin';

    if (body.action === 'record_manual_citation') {
      const engine = body.engine as 'ChatGPT' | 'Gemini' | 'Claude' | 'Perplexity';
      const validEngines = ['ChatGPT', 'Gemini', 'Claude', 'Perplexity'];
      if (!validEngines.includes(engine)) {
        return NextResponse.json({ error: 'Invalid AI engine name.' }, { status: 400 });
      }
      brandRegistry.recordManualAiCitation({
        engine,
        citationCount: Math.max(0, Number(body.citationCount || 1)),
        sampleQuery: String(body.sampleQuery || '').slice(0, 240),
        citationConfidence: Math.min(100, Math.max(0, Number(body.citationConfidence || 80))),
        trend: body.trend === 'decreasing' || body.trend === 'increasing' ? body.trend : 'stable',
        verifiedBy: actor,
      });
      return NextResponse.json({
        success: true,
        citations: brandRegistry.getCitations(),
      });
    }

    const proposalId = String(body.proposalId || '').trim();
    const decision = body.decision as 'approve_and_implement' | 'dismiss' | 'reopen';
    if (!proposalId || !['approve_and_implement', 'dismiss', 'reopen'].includes(decision)) {
      return NextResponse.json({ error: 'Provide valid proposalId and decision.' }, { status: 400 });
    }

    const result = await executeOptimizationDecision({
      proposalId,
      decision,
      actorEmail: actor,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    const updatedLoop = await syncOptimizationProposals();
    return NextResponse.json({
      ...result,
      loop: updatedLoop,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Optimization action failed.' }, { status: 500 });
  }
}
