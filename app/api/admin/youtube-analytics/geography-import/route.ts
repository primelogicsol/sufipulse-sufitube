import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  getYouTubeGeographySnapshot,
  ingestYouTubeGeographyZipBuffer,
  saveYouTubeGeographySnapshot,
} from '@/lib/youtube-geography-import';

export const dynamic = 'force-dynamic';

function formatError(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'YouTube Studio Geography ZIP import failed.';
}

/**
 * GET /api/admin/youtube-analytics/geography-import
 * Admin-only endpoint inspecting the active Geography snapshot & version history.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const snapshot = getYouTubeGeographySnapshot();
  if (!snapshot) {
    return NextResponse.json({
      imported: false,
      source: 'youtube_studio_geography_csv',
      snapshot: null,
    });
  }

  return NextResponse.json({
    imported: true,
    source: snapshot.source,
    version: snapshot.version,
    snapshot,
  });
}

/**
 * POST /api/admin/youtube-analytics/geography-import
 * Admin-only multipart upload accepting a newer YouTube Studio Geography `.zip` export.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const form = await request.formData();
    const uploaded = form.get('file');

    if (!(uploaded instanceof File)) {
      return NextResponse.json(
        { error: 'A YouTube Studio Geography .zip archive is required.' },
        { status: 400 }
      );
    }

    if (!uploaded.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Only official YouTube Studio Geography .zip exports are accepted.' },
        { status: 415 }
      );
    }

    if (uploaded.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Geography ZIP archive exceeds the 15 MB upload limit.' },
        { status: 413 }
      );
    }

    const reportingPeriodStart =
      typeof form.get('reportingPeriodStart') === 'string' &&
      String(form.get('reportingPeriodStart')).trim()
        ? String(form.get('reportingPeriodStart')).trim()
        : undefined;
    const reportingPeriodEnd =
      typeof form.get('reportingPeriodEnd') === 'string' &&
      String(form.get('reportingPeriodEnd')).trim()
        ? String(form.get('reportingPeriodEnd')).trim()
        : undefined;

    const arrayBuf = await uploaded.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const snapshot = await ingestYouTubeGeographyZipBuffer(buffer, uploaded.name, {
      reportingPeriodStart,
      reportingPeriodEnd,
    });

    saveYouTubeGeographySnapshot(snapshot);

    return NextResponse.json({
      success: true,
      version: snapshot.version,
      importedAt: snapshot.importedAt,
      zipFileName: snapshot.zipFileName,
      zipSha256: snapshot.zipSha256,
      reportingPeriodLabel: snapshot.reportingPeriodLabel,
      counts: snapshot.counts,
      totals: snapshot.totals,
      summary: snapshot.summary,
      message: `Imported verified Geography snapshot v${snapshot.version} (${snapshot.counts.measurableCountries} measurable countries, ${snapshot.counts.listedCountryRows} listed territories).`,
    });
  } catch (error: unknown) {
    console.error('[youtube-analytics/geography-import] Import failed:', error);
    return NextResponse.json({ error: formatError(error) }, { status: 422 });
  }
}
