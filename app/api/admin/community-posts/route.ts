/**
 * app/api/admin/community-posts/route.ts
 *
 * API endpoint to retrieve and generate formatted YouTube Community Posts
 * for catalog releases and pipeline drafts.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';

export const dynamic = 'force-dynamic';

const POSTS_FILE = path.join(process.cwd(), '.data', 'youtube-community-posts.json');

function loadPreGeneratedPosts(): any[] {
  if (fs.existsSync(POSTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    } catch {}
  }
  return [];
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const targetId = searchParams.get('id');

  const preGenerated = loadPreGeneratedPosts();

  if (!targetId) {
    return NextResponse.json({
      success: true,
      total: preGenerated.length,
      posts: preGenerated,
    });
  }

  // Find existing pre-generated post
  const match = preGenerated.find(
    (p) => p.id === targetId || p.slug === targetId || p.youtubeId === targetId
  );

  if (match) {
    return NextResponse.json({
      success: true,
      post: match,
    });
  }

  // If not in pre-generated list, dynamically generate on the fly
  const draft = pipelineDraftStorage.getDraft(targetId);
  const release = !draft ? cmsServerStorage.getRelease(targetId) : null;

  if (!draft && !release) {
    return NextResponse.json({ error: 'Release or Draft not found' }, { status: 404 });
  }

  const title = draft ? draft.title : (release?.title || 'Sacred Kalam');
  const slug = draft ? draft.slug : (release?.slug || targetId);
  const youtubeId = draft ? ((draft as any).downstreamStatus?.publishedYoutubeId || '') : (release?.youtubeId || '');

  const isFootprints =
    targetId.includes('1794752884539') ||
    slug === 'footprints-behind' ||
    slug === 'some-people-leave-footprints-behind' ||
    /footprints behind|کچھ لوگ نشاں/i.test(title);

  let postContent = '';
  let whatsappContent = '';
  let telegramContent = '';

  if (isFootprints) {
    postContent = [
      `SOME PEOPLE LEAVE FOOTPRINTS BEHIND`,
      ``,
      `What will remain of us when our footsteps fade?`,
      ``,
      `A mountain trail. A written page. A craftsman's livelihood. A life changed through someone else's guidance.`,
      ``,
      `Our original song celebrates the people whose contributions become part of other people's journeys.`,
      ``,
      `A special expression of gratitude to Mahmood Ahmad Shah for his guidance in our work supporting Kashmir's artisans and living craft heritage.`,
      ``,
      `FOUR YEARS. ONE VISION. WE DID IT!`,
      ``,
      `Watch the complete musical reflection:`,
      `https://www.youtube.com/watch?v=${youtubeId || 'G595CGkQ4jc'}`,
      ``,
      `#SufiPulseUSA #KashmirArtisans #SomePeopleLeaveFootprintsBehind`,
    ].join('\n');

    whatsappContent = [
      `SOME PEOPLE LEAVE FOOTPRINTS BEHIND`,
      ``,
      `Some make a difference once. Others make it their way of life, again and again.`,
      ``,
      `A soulful musical reflection on mountains, craftsmanship, fatherhood, guidance and lasting human legacy.`,
      ``,
      `An original SufiPulse USA release by Dr. Zarf-e-Noori.`,
      ``,
      `Watch the complete song:`,
      `https://www.youtube.com/watch?v=${youtubeId || 'G595CGkQ4jc'}`,
      ``,
      `#SufiPulseUSA #KashmirCrafts #LifeAndLegacy`,
    ].join('\n');

    telegramContent = whatsappContent;
  } else {
    postContent = [
      `🌙 "${title}" — SufiPulse USA`,
      ``,
      `Experience "${title}", an original musical reflection presented by SufiPulse USA.`,
      ``,
      youtubeId ? `▶️ Watch on YouTube with Multilingual Subtitles:\nhttps://www.youtube.com/watch?v=${youtubeId}` : '',
      ``,
      `📖 Read lyrics, translation & commentary on SufiPulse:`,
      `https://www.sufipulse.com/release-detail/${slug}`,
      ``,
      `Share your reflections in the comments below. 👇`,
      ``,
      `#SufiPulse #SufiMusic #SpiritualKalam #SufiPulseUSA`,
    ].filter(Boolean).join('\n');

    whatsappContent = [
      `🌙 *"${title}"*`,
      `An original musical reflection from SufiPulse USA.`,
      ``,
      `▶️ https://www.youtube.com/watch?v=${youtubeId || ''}`,
      ``,
      `#SufiPulseUSA #SufiMusic`,
    ].join('\n');

    telegramContent = whatsappContent;
  }

  const dynamicPost = {
    id: targetId,
    title,
    youtubeId,
    slug,
    post: postContent,
    whatsapp: whatsappContent,
    telegram: telegramContent,
  };

  return NextResponse.json({
    success: true,
    post: dynamicPost,
  });
}
