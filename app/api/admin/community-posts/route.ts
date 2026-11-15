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

  const dynamicPost = {
    id: targetId,
    title,
    youtubeId,
    slug,
    post: [
      `🌙 "${title}" — A Sacred Spiritual Release from SufiPulse USA`,
      ``,
      `"دل کو منور کر دے نورِ حق سے`,
      `ہر غم مٹ جائے تیرے کرم سے"`,
      ``,
      `We invite you to immerse yourself in this mystical contemplation from the valley of Kashmir.`,
      ``,
      youtubeId ? `▶️ Watch on YouTube with Multilingual Subtitles:\nhttps://www.youtube.com/watch?v=${youtubeId}` : '',
      ``,
      `📖 Read lyrics, translation & commentary on SufiPulse:`,
      `https://www.sufipulse.com/release-detail/${slug}`,
      ``,
      `Share your reflections in the comments below. 👇`,
      ``,
      `#SufiPulse #SufiMusic #Kashmir #Spiritual #Kalam #UrduPoetry`,
    ].filter(Boolean).join('\n'),
  };

  return NextResponse.json({
    success: true,
    post: dynamicPost,
  });
}
