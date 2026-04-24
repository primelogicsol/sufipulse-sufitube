import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { logger } from '@/app/lib/logger';
import { auditLog } from '@/app/lib/audit-log';

export const dynamic = 'force-dynamic';

const apiLogger = logger.api;

/**
 * Expected AudioShake Webhook Payload (Stub)
 * Reference: https://developer.audioshake.ai
 */
interface AudioShakeWebhookBody {
  job_id: string;
  status: 'completed' | 'failed' | 'processing';
  metadata?: {
    release_id: string;   // Passed when the job was originated
    language_key: string; // Passed to map transcript correctly (e.g., 'roman_urdu', 'english')
  };
  results?: {
    transcription?: {
      aligned_lyrics?: Array<{
        text: string;
        start_time: number;
        end_time: number;
      }>;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Webhook Secret (Prevent unauthorized writes)
    const secret = request.headers.get('x-audioshake-signature');
    if (secret !== process.env.AUDIOSHAKE_WEBHOOK_SECRET) {
        apiLogger.warn('Unauthorized AudioShake webhook attempt', { ip: request.headers.get('x-forwarded-for') });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Incoming AudioShake Payload
    const body: AudioShakeWebhookBody = await request.json();
    apiLogger.info(`AudioShake webhook received for job: ${body.job_id}`, { status: body.status });

    if (body.status !== 'completed' || !body.results?.transcription?.aligned_lyrics) {
      return NextResponse.json({ message: 'Job not completed or missing transcription data. Acknowledged.' }, { status: 200 });
    }

    // 3. Locate Target CMS Release
    const releaseId = body.metadata?.release_id;
    const targetLanguage = body.metadata?.language_key || 'english';

    if (!releaseId) {
      apiLogger.error('AudioShake payload missing release_id metadata mapping.');
      return NextResponse.json({ error: 'Missing release_id' }, { status: 400 });
    }

    const release = cmsServerStorage.getRelease(releaseId);
    if (!release) {
      apiLogger.error(`AudioShake mapped to non-existent release: ${releaseId}`);
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // 4. Map AudioShake Aligned Timing → SufiPulse Native Structure
    // SufiPulse cues use a structure like: { id: 'cue_1', start: 0.00, end: 5.00, text: '...' }
    const alignedData = body.results.transcription.aligned_lyrics;
    
    // We only mutate the subtitleCues array globally if they don't exist yet,
    // since timing is globally shared in the CMS Master Track. 
    // Usually, transcription directly replaces it.
    const newCues = alignedData.map((line, index) => ({
      id: `audio_shake_${body.job_id}_${index + 1}`,
      start: line.start_time,
      end: line.end_time,
      alignment: 2, // Default center-bottom
      positionX: 50,
      positionY: 90,
      maxWidthPercent: 82,
    }));

    // Generate the translation payload
    const newTranslations: Record<string, string> = {};
    alignedData.forEach((line, index) => {
        newTranslations[`audio_shake_${body.job_id}_${index + 1}`] = line.text;
    });

    // 5. Update and Save into CMS Storage
    const updatedSubtitleCues = newCues.length > 0 ? newCues : release.subtitleCues;
    
    cmsServerStorage.saveRelease({
      ...release,
      subtitleCues: updatedSubtitleCues,
      subtitleTranslations: {
        ...(release.subtitleTranslations || {}),
        [targetLanguage]: newTranslations
      }
    });

    // Log the success for the dashboard
    auditLog({
      userId: 'audioshake_webhook',
      userEmail: 'system',
      action: 'ai_transcription_completed',
      resourceType: 'release',
      resourceId: releaseId,
      details: { 
        job_id: body.job_id,
        language: targetLanguage,
        word_count: newTranslations.length 
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, mapped_lines: newCues.length });

  } catch (error: any) {
    apiLogger.error(`AudioShake Webhook processing failed: ${error.message}`);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
