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
      approve: 'approved',
      reject: 'rejected',
      request_changes: 'changes_requested',
    };

    if (action === 'create_campaign') {
      // Trigger actual Google Ads campaign creation
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

      const updated = await updateCampaignRequestStatus(adoptionId, 'campaign_created', adminNote, {
        campaignResourceName: createData.campaign_resource_name,
      });

      await addCampaignRequestEvent(adoptionId, {
        eventType: 'campaign_created',
        actorType: 'admin',
        actorId: authResult.id,
        message: 'Campaign created in Google Ads.',
        metadata: {
          campaign_resource_name: createData.campaign_resource_name,
          customer_id: createData.customer_id,
        },
      });

      // Also update the campaign store record
      if (createData.campaign_resource_name) {
        await upsertGoogleAdsCampaign({
          adoptionId,
          releaseId: releaseId || existing.releaseId,
          userId: existing.userId || '',
          selectedCustomerId: selectedCustomerId || existing.googleAdsCustomerId || '',
          youtubeVideoId: youtubeVideoId || existing.youtubeVideoId || '',
          budgetAmount: budgetAmount || existing.budgetAmount,
          campaignResourceName: createData.campaign_resource_name,
          campaignStatus: 'PAUSED',
        });
      }

      return NextResponse.json({ success: true, request: updated, campaign: createData });
    }

    // approve / reject / request_changes
    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json(
        { error: `Unknown action: ${action}. Use approve, reject, request_changes, or create_campaign.` },
        { status: 400 }
      );
    }

    const updated = await updateCampaignRequestStatus(adoptionId, newStatus, adminNote);
    await addCampaignRequestEvent(adoptionId, {
      eventType: action === 'request_changes' ? 'changes_requested' : action as any,
      actorType: 'admin',
      actorId: authResult.id,
      message: adminNote,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
