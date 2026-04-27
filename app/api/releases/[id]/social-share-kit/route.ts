import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { generateSocialShareKit } from '@/lib/social-share-generator';

export const dynamic = 'force-dynamic';

// POST /api/releases/[id]/social-share-kit
// Generates (or regenerates) the social share kit for any release, regardless of status.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  }

  if (!release.youtubeId) {
    return NextResponse.json({ error: 'Release has no YouTube ID — cannot generate share kit' }, { status: 400 });
  }

  const socialShareKit = generateSocialShareKit(release);
  const updated = cmsServerStorage.saveRelease({ ...release, socialShareKit });

  return NextResponse.json({ socialShareKit: updated.socialShareKit });
}
