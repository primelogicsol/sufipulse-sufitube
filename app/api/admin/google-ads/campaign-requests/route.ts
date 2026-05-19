import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampaignRequests,
  updateCampaignRequestStatus,
  addCampaignRequestEvent,
  getCampaignRequest,
  type CampaignRequestStatus,
} from '@/app/lib/server/google-ads-campaign-request-store';
import { upsertGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';
import { requireAdmin } from '@/server/middleware/authenticate';

/**
 * GET /api/admin/google-ads/campaign-requests
 * Returns all campaign requests for admin review.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const requests = await getAllCampaignRequests();
    return NextResponse.json(requests);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/google-ads/campaign-requests
 * Admin actions: approve, reject, request_changes, create_campaign.
 *
 * Body: { adoptionId, action, adminNote?, youtubeVideoId?, budgetAmount?, selectedCustomerId? }
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const {
      adoptionId,
      action,
      adminNote,
      youtubeVideoId,
      budgetAmount,
      selectedCustomerId,
      releaseId,
    } = body;

    if (!adoptionId || !action) {
      return NextResponse.json(
        { error: 'adoptionId and action are required' },
        { status: 400 }
      );
    }

    const existing = await getCampaignRequest(adoptionId);
    if (!existing) {
      return NextResponse.json({ error: 'Campaign request not found' }, { status: 404 });
    }

    const statusMap: Record<string, CampaignRequestStatus> = {
      start_review: 'under_review',
      prepare: 'prepared',
      request_user_approval: 'awaiting_user_approval',
      mark_launch_ready: 'launch_ready',
      approve: 'approved',
      reject: 'rejected',
      request_changes: 'changes_requested',
      complete: 'completed',
    };

    if (action === 'add_note') {
      const updated = await addCampaignRequestEvent(adoptionId, {
        eventType: 'note_added',
        actorType: 'admin',
        actorId: authResult.id,
        message: adminNote,
        internalOnly: true,
      });
      return NextResponse.json({ success: true, request: updated });
    }

    if (action === 'create_campaign' || action === 'launch') {
      // Trigger actual Google Ads campaign creation (Launch)
      const createBody = {
        adoptionId,
        releaseId: releaseId || existing.releaseId,
        userId: existing.userId || '',
        youtubeVideoId: youtubeVideoId || existing.youtubeVideoId || '',
        releaseTitle: existing.releaseTitle || '',
        budgetAmount: budgetAmount || existing.budgetAmount,
        methodType: existing.methodType ?? 'use_my_google_ads',
        selectedCustomerId: selectedCustomerId || existing.googleAdsCustomerId || '',
        targetRegions: existing.targetRegions,
        targetLanguages: existing.targetLanguages,
        campaignObjective: existing.campaignObjective,
        durationDays: existing.durationDays,
      };

      const createRes = await fetch(
        new URL('/api/google-ads/campaigns/create', request.url).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: request.headers.get('cookie') ?? '',
          },
          body: JSON.stringify(createBody),
        }
      );

      const createData = await createRes.json();

      if (!createRes.ok) {
        await updateCampaignRequestStatus(adoptionId, 'campaign_failed', adminNote, {
          adminNote: createData.error || 'Campaign creation failed',
        });
        await addCampaignRequestEvent(adoptionId, {
          eventType: 'campaign_failed',
          actorType: 'admin',
          actorId: authResult.id,
          message: createData.error || 'Campaign creation failed',
          metadata: createData,
        });
        return NextResponse.json(
          { error: createData.error || 'Campaign creation failed', details: createData },
          { status: 502 }
        );
      }

      // If dry run passed, we stay in prepared or launch_ready
      const isDryRunPassed = createData.status === 'dry_run_passed';
      const finalStatus = isDryRunPassed ? existing.status : 'live';

      const updated = await updateCampaignRequestStatus(adoptionId, finalStatus, adminNote, {
        campaignResourceName: createData.campaign_resource_name,
      });

      await addCampaignRequestEvent(adoptionId, {
        eventType: isDryRunPassed ? 'prepared' : 'launched',
        actorType: 'admin',
        actorId: authResult.id,
        message: isDryRunPassed ? 'Validation passed (Dry Run).' : 'Campaign launched live in Google Ads.',
        metadata: {
          campaign_resource_name: createData.campaign_resource_name,
          customer_id: createData.customer_id,
          isDryRun: isDryRunPassed
        },
      });

      return NextResponse.json({ success: true, request: updated, campaign: createData });
    }

    // Standard lifecycle transitions
    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json(
        { error: `Unknown action: ${action}.` },
        { status: 400 }
      );
    }

    const eventTypeMap: Record<string, any> = {
      start_review: 'review_started',
      prepare: 'prepared',
      request_user_approval: 'approval_requested',
      mark_launch_ready: 'launch_ready',
      approve: 'approved',
      reject: 'rejected',
      request_changes: 'changes_requested',
      complete: 'completed',
    };

    const updated = await updateCampaignRequestStatus(adoptionId, newStatus, adminNote, {
      proposedTargeting: body.proposedTargeting,
      proposedBudget: body.proposedBudget,
      proposedKeywords: body.proposedKeywords,
      proposedAdCopy: body.proposedAdCopy,
    });

    await addCampaignRequestEvent(adoptionId, {
      eventType: eventTypeMap[action] || 'note_added',
      actorType: 'admin',
      actorId: authResult.id,
      message: adminNote || `Status changed to ${newStatus.replace(/_/g, ' ')}`,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
