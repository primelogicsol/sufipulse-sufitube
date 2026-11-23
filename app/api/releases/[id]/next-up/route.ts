import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { CMSRelease, getWriterDisplayName, getVocalistDisplayName } from '@/lib/cms-storage';
import { getAuthUser, checkIsAdmin } from '@/server/middleware/authenticate';
import { toCanonicalCMSRelease, toPublicRelease } from '@/server/storage/release-dto';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const currentRelease = cmsServerStorage.getRelease(params.id) || cmsServerStorage.getReleaseBySlug(params.id);
  if (!currentRelease) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  }

  const user = await getAuthUser(request);
  const isAdmin = checkIsAdmin(user);
  if (!isAdmin && (currentRelease.status !== 'published' || (currentRelease.visibility || 'public') !== 'public')) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const allReleases = cmsServerStorage.getPublishedReleases();

  const getKeywords = (r: CMSRelease) => {
    const text = [
      r.title, r.subtitle, r.category, r.releaseType, getWriterDisplayName(r.writer),
      r.description, r.youtubeTitle, getVocalistDisplayName(r.vocalist)
    ].join(' ').toLowerCase();
    
    return {
      kashmiri: text.includes('kashmiri') || text.includes('mahjoor'),
      urdu: text.includes('urdu') || text.includes('ghazal'),
      english: text.includes('english'),
      mysticism: text.includes('mystic') || text.includes('sufi') || text.includes('fana') || text.includes('baqa'),
      devotion: text.includes('devotion') || text.includes('love') || text.includes('ishq'),
      silence: text.includes('silence') || text.includes('khamoshi'),
      qawwali: text.includes('qawwali'),
      kalam: text.includes('kalam')
    };
  };

  const currentKw = getKeywords(currentRelease);

  function recommendationScore(current: CMSRelease, candidate: CMSRelease, cKw: any) {
    let score = 0;
    
    const currWriter = getWriterDisplayName(current.writer);
    const candWriter = getWriterDisplayName(candidate.writer);
    const currVoc = getVocalistDisplayName(current.vocalist);
    const candVoc = getVocalistDisplayName(candidate.vocalist);

    if (current.category && current.category === candidate.category) score += 15;
    if (currWriter && currWriter === candWriter) score += 20;
    if (currVoc && currVoc === candVoc) score += 15;
    
    const overlaps = ['kashmiri', 'urdu', 'english', 'mysticism', 'devotion', 'silence', 'qawwali', 'kalam'];
    for (const key of overlaps) {
      if ((currentKw as any)[key] && (cKw as any)[key]) score += 10;
    }
    
    if (candidate.publishedAt && current.publishedAt) {
        const diffDays = Math.abs(new Date(current.publishedAt).getTime() - new Date(candidate.publishedAt).getTime()) / (1000 * 3600 * 24);
        if (diffDays < 30) score += 5;
    }

    return score;
  }

  const scored = allReleases
    .filter((song) => song.id !== currentRelease.id)
    .filter((song) => song.youtubeId)
    .map((song) => {
      const cKw = getKeywords(song);
      return { ...song, score: recommendationScore(currentRelease, song, cKw) };
    })
    .sort((a, b) => b.score - a.score);

  const next = scored[0] || null;
  return NextResponse.json(next ? toPublicRelease(toCanonicalCMSRelease(next)) : null, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=0, must-revalidate' },
  });
}