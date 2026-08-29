import { NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { CMSRelease } from '@/lib/cms-storage';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const currentRelease = cmsServerStorage.getRelease(params.id);
  if (!currentRelease) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  }

  const allReleases = cmsServerStorage.getPublishedReleases();

  const getKeywords = (r: CMSRelease) => {
    const text = [
      r.title, r.subtitle, r.category, r.releaseType, r.writer?.name,
      r.description, r.youtubeTitle, r.vocalist?.name
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
    
    if (current.category && current.category === candidate.category) score += 15;
    if (current.writer?.name && current.writer.name === candidate.writer?.name) score += 20;
    if (current.vocalist?.name && current.vocalist.name === candidate.vocalist?.name) score += 15;
    
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
  return NextResponse.json(next);
}