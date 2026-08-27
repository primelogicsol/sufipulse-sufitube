import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  getYouTubeStudioSnapshot,
  parseYouTubeStudioCsv,
  saveYouTubeStudioSnapshot,
} from '@/lib/youtube-studio-import';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const snapshot = getYouTubeStudioSnapshot();
  if (!snapshot) {
    return NextResponse.json({
      imported: false,
      source: 'youtube_studio_advanced_mode_csv',
      snapshot: null,
    });
  }

  return NextResponse.json({
    imported: true,
    source: snapshot.source,
    snapshot,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const form = await request.formData();
    const uploaded = form.get('file');

    if (!(uploaded instanceof File)) {
      return NextResponse.json({ error: 'A CSV file is required.' }, { status: 400 });
    }

    if (!uploaded.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Only YouTube Studio CSV exports are accepted.' }, { status: 415 });
    }

    if (uploaded.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'CSV exceeds the 10 MB Phase 1 import limit.' }, { status: 413 });
    }

    const text = await uploaded.text();
    const snapshot = parseYouTubeStudioCsv(text, uploaded.name);
    saveYouTubeStudioSnapshot(snapshot);

    const availableMetrics = {
      views: snapshot.rows.some(row => row.views !== null),
      watchTime: snapshot.rows.some(row => row.watchTimeMinutes !== null),
      averageViewDuration: snapshot.rows.some(row => row.avgViewDurationSecs !== null),
      impressions: snapshot.rows.some(row => row.impressions !== null),
      impressionsCtr: snapshot.rows.some(row => row.ctr !== null),
      publishedAt: snapshot.rows.some(row => row.publishedAt !== null),
    };

    return NextResponse.json({
      success: true,
      source: snapshot.source,
      importedAt: snapshot.importedAt,
      fileName: snapshot.fileName,
      rowCount: snapshot.rowCount,
      columns: snapshot.columns,
      availableMetrics,
      message: `Imported ${snapshot.rowCount} unique YouTube video rows from YouTube Studio.`,
    });
  } catch (error: any) {
    console.error('[youtube-analytics/studio-import] Import failed:', error);
    return NextResponse.json(
      { error: error?.message || 'YouTube Studio CSV import failed.' },
      { status: 422 }
    );
  }
}
