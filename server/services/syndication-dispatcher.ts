/**
 * server/services/syndication-dispatcher.ts
 *
 * Automated Multi-Platform Social & Search Syndication Dispatcher.
 * Automatically distributes release alerts, vertical teasers, and search engine pings
 * across Telegram, WhatsApp, Meta (Facebook/Instagram), and IndexNow on publish.
 */

import fs from 'node:fs';
import path from 'node:path';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { generateSocialShareKit } from '@/lib/social-share-generator';
import { submitInstantIndexing, type IndexingResult } from '@/server/services/instant-indexer';
import { logger } from '@/app/lib/logger';

export interface SyndicationDispatchResult {
  releaseId: string;
  slug: string;
  title: string;
  dispatchedAt: string;
  indexing: IndexingResult;
  telegram: {
    status: 'sent' | 'skipped' | 'failed';
    message?: string;
  };
  whatsapp: {
    status: 'ready' | 'sent' | 'skipped';
    kit: string;
    shareUrl: string;
  };
  meta: {
    status: 'sent' | 'skipped' | 'failed';
    message?: string;
  };
}

export async function dispatchReleaseSyndication(
  releaseId: string
): Promise<SyndicationDispatchResult> {
  const release = cmsServerStorage.getRelease(releaseId);
  if (!release) {
    throw new Error(`Release ${releaseId} not found in CMS storage`);
  }

  const title = release.title || 'Sacred Kalam';
  const slug = release.slug || releaseId;
  const canonicalUrl = `https://www.sufipulse.com/release-detail/${slug}`;
  const now = new Date().toISOString();

  // 1. Instant Search Engine Indexing (Google & IndexNow)
  const indexing = await submitInstantIndexing(canonicalUrl);

  // 2. Generate Multi-Platform Text Kits
  const shareKit = generateSocialShareKit(release);

  // 3. Telegram Automated Broadcast
  let telegramStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
  let telegramMessage = 'Telegram credentials not set in environment';

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHANNEL_ID;

  if (telegramToken && telegramChatId) {
    try {
      const tgUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
      const tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: shareKit.telegram,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (tgRes.ok) {
        telegramStatus = 'sent';
        telegramMessage = 'Broadcasted successfully to Telegram channel';
      } else {
        telegramStatus = 'failed';
        telegramMessage = `Telegram API HTTP ${tgRes.status}`;
      }
    } catch (err: any) {
      telegramStatus = 'failed';
      telegramMessage = `Telegram dispatch error: ${err.message}`;
    }
  }

  // 4. WhatsApp Cloud API / Viral Status Kit
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareKit.whatsapp)}`;
  const whatsappStatus: 'ready' | 'sent' | 'skipped' = 'ready';

  // 5. Meta Graph API (Facebook / Instagram)
  let metaStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
  let metaMessage = 'Meta Graph API token not configured';

  const metaToken = process.env.META_ACCESS_TOKEN;
  const metaPageId = process.env.META_PAGE_ID;

  if (metaToken && metaPageId) {
    try {
      const fbUrl = `https://graph.facebook.com/v20.0/${metaPageId}/feed`;
      const fbRes = await fetch(fbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: shareKit.facebook,
          access_token: metaToken,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (fbRes.ok) {
        metaStatus = 'sent';
        metaMessage = 'Published to Facebook Page';
      } else {
        metaStatus = 'failed';
        metaMessage = `Meta Graph API HTTP ${fbRes.status}`;
      }
    } catch (err: any) {
      metaStatus = 'failed';
      metaMessage = `Meta Graph dispatch error: ${err.message}`;
    }
  }

  const result: SyndicationDispatchResult = {
    releaseId,
    slug,
    title,
    dispatchedAt: now,
    indexing,
    telegram: {
      status: telegramStatus,
      message: telegramMessage,
    },
    whatsapp: {
      status: whatsappStatus,
      kit: shareKit.whatsapp,
      shareUrl: whatsappShareUrl,
    },
    meta: {
      status: metaStatus,
      message: metaMessage,
    },
  };

  // 6. Record in persistent syndication logs
  try {
    const logPath = path.join(process.cwd(), '.data', 'syndication-logs.json');
    let logs: any[] = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    logs.unshift(result);
    // Keep last 100 entries
    if (logs.length > 100) logs = logs.slice(0, 100);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err: any) {
    logger.api.error(`[SyndicationDispatcher] Failed to write log: ${err.message}`);
  }

  logger.api.info(`[SyndicationDispatcher] Completed automated dispatch for ${releaseId}`);
  return result;
}
