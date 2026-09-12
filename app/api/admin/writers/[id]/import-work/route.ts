import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { entityCreate, entityGetAll, entityUpdate } from '@/lib/entity-storage-server';
import { fetchConfiguredPrivateAudioAlignment, normalizePrivateAudioAlignment } from '@/server/integrations/private-audio-alignment';
import crypto from 'node:crypto';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: writerId } = await params;
    const body = await request.json();
    const sourceAssetId = body.sourceAssetId?.trim();

    if (!sourceAssetId) {
      return NextResponse.json({ error: 'Missing sourceAssetId' }, { status: 400 });
    }

    // Currently restricted only to Dr. Zarf-e-Noori to avoid generic overwrite behavior
    if (writerId !== 'writers_ed6c98ae-bac7-44cd-8765-2f9fc35ef9a9') {
      return NextResponse.json({ error: 'Import restricted to Canonical Writer' }, { status: 403 });
    }

    // 1. Fetch from source
    let rawSource: any;
    try {
      rawSource = await fetchConfiguredPrivateAudioAlignment(sourceAssetId);
    } catch (err: any) {
      return NextResponse.json({ error: `Source fetch failed: ${err.message}` }, { status: 502 });
    }

    // 2. Extract Data
    let title = rawSource?.title || 'Imported Work';
    let lyrics = rawSource?.metadata?.prompt || rawSource?.lyric || '';
    
    // Fallback to alignment parsing if pure lyric isn't present
    if (!lyrics) {
      try {
        const normalized = normalizePrivateAudioAlignment(rawSource);
        lyrics = normalized.lines.map(l => l.text).join('\n');
      } catch (err) {
        lyrics = ''; // Silent fallback
      }
    }

    // Ensure it's not totally empty
    if (!lyrics.trim()) {
      return NextResponse.json({ error: 'No lyric text could be extracted from source.' }, { status: 422 });
    }

    // 3. Match / Check Existing
    const kalams = entityGetAll('kalams');
    const existing = kalams.find((k: any) => k.title?.toLowerCase() === title.toLowerCase() && k.user_id === writerId);

    if (existing) {
      return NextResponse.json({ 
        action: 'COMPARE_UPDATE_DRAFT',
        existingId: existing.id,
        fetchedTitle: title,
        fetchedLyrics: lyrics,
      });
    }

    // 4. Create Draft
    const record = entityCreate('kalams', {
      title,
      content: lyrics,
      language: 'Unknown',
      form_style: 'Imported',
      thematic_category: 'Imported',
      user_id: writerId,
      email: auth.email,
      status: 'submitted',
      source_asset_id: sourceAssetId,
      credits: {
        writer: writerId,
        lyricist: writerId,
        composer: writerId,
        music_director: writerId
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const referenceId = `SP-KLM-${new Date().getFullYear()}-${record.id.split('_')[1]?.slice(0, 8).toUpperCase() || crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const finalRecord = entityUpdate('kalams', record.id, { referenceId });

    return NextResponse.json({
      action: 'CREATED_DRAFT',
      workId: record.id,
      title,
      fetchedLyrics: lyrics,
      status: 'submitted',
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
