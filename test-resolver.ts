import { resolveYouTubeDiscoveryPackage } from './server/services/youtube-discovery';
import { CMSRelease } from './lib/cms-storage';
import * as assert from 'assert';

console.log('Running resolver assertions...');

const baseRelease: CMSRelease = {
  id: 'r1',
  slug: 'r1',
  title: 'Test',
  youtubeId: 'y1',
  description: '',
  releaseDate: '',
  durationSeconds: 100,
  durationFormatted: '1:40',
  viewCount: 0,
  defaultAudioLanguage: 'ur',
  primaryTags: [],
  secondaryTags: [],
  relatedReleases: [],
  updatedAt: '',
  legacyMigrationId: null,
  legacyWpId: null,
};

// 1. DRAFT -> NEEDS_REVIEW
const draftRelease = {
  ...baseRelease,
  canonicalLyrics: { text: 'abc', status: 'DRAFT', primaryLanguage: 'ur', languages: ['ur'], source: 'MANUAL' }
};
const pkg1 = resolveYouTubeDiscoveryPackage(draftRelease as any);
assert.strictEqual(pkg1.lyrics.readiness, 'NEEDS_REVIEW');

// 2. REVIEWED -> NEEDS_APPROVAL
const reviewedRelease = {
  ...baseRelease,
  canonicalLyrics: { text: 'abc', status: 'REVIEWED', primaryLanguage: 'ur', languages: ['ur'], source: 'MANUAL' }
};
const pkg2 = resolveYouTubeDiscoveryPackage(reviewedRelease as any);
assert.strictEqual(pkg2.lyrics.readiness, 'NEEDS_APPROVAL');

// 3. APPROVED -> READY
const approvedRelease = {
  ...baseRelease,
  canonicalLyrics: { text: 'abc', status: 'APPROVED', primaryLanguage: 'ur', languages: ['ur'], source: 'MANUAL' }
};
const pkg3 = resolveYouTubeDiscoveryPackage(approvedRelease as any);
assert.strictEqual(pkg3.lyrics.readiness, 'READY');

console.log('All resolver assertions PASSED.');
