/**
 * POST /api/releases/[id]/import-captions/from-video
 *
 * Receives IngestCue[] produced by the browser-side videoFileToParsedCues(),
 * runs the shared normalization + validation gate, and writes to the CMS.
 *
 * The video is never sent to the server — only the extracted cue data.
 * This keeps the server lightweight and avoids timeout and memory issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { normalizeParsedCues, validateParsedCues, type IngestCue } from '@/lib/subtitle-ingest/normalizeParsedCues';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const rawCues: IngestCue[] = Array.isArray(body.cues) ? body.cues : [];
  const language: string = String(body.language || release.defaultLanguage || 'en').trim();
  const mode: 'replace' | 'merge' = body.mode === 'merge' ? 'merge' : 'replace';

  if (rawCues.length === 0) {
    return NextResponse.json({ error: 'cues array is required and must not be empty' }, { status: 400 });
  }

  // Shared normalization + validation gate (same as YouTube import path)
  const { cues: normalizedCues, stats } = normalizeParsedCues(rawCues);
  const { ok, warnings } = validateParsedCues(normalizedCues);
  if (!ok) {
    return NextResponse.json({ error: `Caption data failed validation: ${warnings.join(' ')}` }, { status: 422 });
  }

  // Build CMS cues
  const now = Date.now();
  const newCues = normalizedCues.map((c, i) => ({
    id: `cue_${now}_vid_${i}`,
    cueNumber: i + 1,
    startTime: c.startTime,
    endTime: c.endTime,
    lineRef: '',
    sourceType: 'video_ocr' as const,
    active: true,
  }));

  const newTranslationMap: Record<string, string> = {};
  normalizedCues.forEach((c, i) => { if (c.text) newTranslationMap[newCues[i].id] = c.text; });

  type SubtitleCue = NonNullable<typeof release.subtitleCues>[number];
  type LangStatus = NonNullable<typeof release.subtitleLanguageStatuses>[string];

  let nextCues: SubtitleCue[];
  let nextTranslations: Record<string, Record<string, string>>;
  let nextStatuses: Record<string, LangStatus>;

  if (mode === 'replace') {
    nextCues = newCues;
    nextTranslations = { [language]: newTranslationMap };
    nextStatuses = { ...(release.subtitleLanguageStatuses || {}), [language]: 'draft' };
  } else {
    const existingCues: SubtitleCue[] = release.subtitleCues || [];
    nextCues = [...existingCues, ...newCues];
    nextTranslations = {
      ...(release.subtitleTranslations || {}),
      [language]: { ...((release.subtitleTranslations || {})[language] || {}), ...newTranslationMap },
    };
    nextStatuses = {
      ...(release.subtitleLanguageStatuses || {}),
      [language]: (release.subtitleLanguageStatuses || {})[language] || 'draft',
    };
  }

  const availableLanguages = Array.from(new Set([...(release.availableLanguages || []), language]));

  const updated = cmsServerStorage.saveRelease({
    ...release,
    subtitleCues: nextCues,
    subtitleTranslations: nextTranslations,
    subtitleLanguageStatuses: nextStatuses,
    availableLanguages,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    importedCount: newCues.length,
    language,
    mode,
    normalizationStats: stats,
    warnings,
    release: updated,
  });
}
