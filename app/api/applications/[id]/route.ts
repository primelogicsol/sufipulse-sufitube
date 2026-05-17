import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll } from '@/lib/entity-storage-server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Tracking token required' }, { status: 403 });
    }

    // Find in writers (Ahl-e-Qalam applications)
    const writers = entityGetAll<any>('writers');
    const application = writers.find((w: any) => w.referenceId === id || w.id === id);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Security check: token must match
    if (application.trackingToken !== token) {
      return NextResponse.json({ error: 'Invalid tracking token' }, { status: 403 });
    }
    
    return NextResponse.json({
      id: application.referenceId || application.id,
      type: 'Writer / Ahl-e-Qalam',
      fullName: application.full_name,
      email: application.email,
      country: application.country,
      primaryLanguages: application.primary_languages,
      writingStyles: application.writing_styles,
      thematicFocus: application.thematic_focus,
      literaryBackground: application.literary_background,
      sampleKalam: application.sample_kalam,
      status: application.profile_status || 'pending_review',
      submittedAt: application.submitted_at || application.created_at,
      adminNote: application.admin_notes || application.admin_note,
      // Masking sensitive data if needed
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
