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
    let application = writers.find((w: any) => w.referenceId === id || w.id === id);
    let type = 'Writer / Ahl-e-Qalam';

    if (!application) {
      // Find in vocalists (Ahl-e-Sada applications)
      const vocalists = entityGetAll<any>('vocalists');
      application = vocalists.find((v: any) => v.referenceId === id || v.id === id);
      type = 'Vocalist / Ahl-e-Sada';
    }

    if (!application) {
      // Find in producers (Ahl-e-Naghma applications)
      const producers = entityGetAll<any>('producers');
      application = producers.find((p: any) => p.referenceId === id || p.id === id);
      type = 'Producer / Ahl-e-Naghma';
    }

    if (!application) {
      // Find in literary (Ahl-e-Tahreer applications)
      const literary = entityGetAll<any>('literary');
      application = literary.find((l: any) => l.referenceId === id || l.id === id);
      type = 'Literary / Ahl-e-Tahreer';
    }

    if (!application) {
      // Find in studio (Karkhana-e-Sada applications)
      const studios = entityGetAll<any>('studio');
      application = studios.find((s: any) => s.referenceId === id || s.id === id);
      type = 'Studio / Karkhana-e-Sada';
    }

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Security check: token must match
    if (application.trackingToken !== token) {
      return NextResponse.json({ error: 'Invalid tracking token' }, { status: 403 });
    }
    
    return NextResponse.json({
      id: application.referenceId || application.id,
      type,
      fullName: application.full_name,
      performanceName: application.performance_name || application.pen_name,
      email: application.email,
      country: application.country,
      city: application.city,
      primaryLanguages: application.primary_languages || application.languages_performed,
      writingStyles: application.writing_styles || application.performance_styles,
      thematicFocus: application.thematic_focus,
      literaryBackground: application.literary_background,
      sampleKalam: application.sample_kalam,
      sampleLink: application.sample_link,
      vocalRange: application.vocal_range,
      yearsExperience: application.years_experience,
      musicalTraining: application.musical_training,
      workedInStudio: application.worked_in_studio,
      willingEditorialApproval: application.willing_editorial_approval,
      acceptProducerCoordination: application.accept_producer_coordination,
      acceptFramework: application.accept_framework,
      status: application.profile_status || application.status || 'pending_review',
      submittedAt: application.submitted_at || application.created_at,
      adminNote: application.admin_notes || application.admin_note,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
