import * as fs from 'fs';
import { cmsServerStorage } from './lib/cms-storage-server';

function mockApiPut(id: string, body: any) {
  const existing = cmsServerStorage.getRelease(id);
  const now = new Date().toISOString();
  
  if (existing?.canonicalLyrics && body.canonicalLyrics) {
    const oldL = existing.canonicalLyrics;
    const newL = body.canonicalLyrics;
    
    const textChanged = oldL.text !== newL.text;
    const primaryLangChanged = oldL.primaryLanguage !== newL.primaryLanguage;
    const langsChanged = JSON.stringify(oldL.languages || []) !== JSON.stringify(newL.languages || []);
    
    if (textChanged || primaryLangChanged || langsChanged) {
      if (oldL.status === 'APPROVED' || oldL.status === 'REVIEWED') {
        newL.status = 'DRAFT';
        delete newL.reviewedAt;
        delete newL.reviewedBy;
        delete newL.approvedAt;
        delete newL.approvedBy;
      }
    }
  }

  const merged = {
    ...existing,
    ...body,
    updatedAt: now,
  };
  
  return cmsServerStorage.saveRelease(merged as any);
}

const releaseInfo = cmsServerStorage.getReleaseBySlug('pehchaan-khud-ko');
const id = releaseInfo ? releaseInfo.id : '';

const baseApproved = {
  text: 'original',
  primaryLanguage: 'ur',
  languages: ['ur'],
  source: 'MANUAL',
  status: 'APPROVED',
  reviewedAt: '2026-09-01T10:00:00.000Z',
  reviewedBy: 'editor_1',
  approvedAt: '2026-09-02T10:00:00.000Z',
  approvedBy: 'admin_1',
};

console.log('\n--- TEST A: Change only languages[] ---');
mockApiPut(id, { canonicalLyrics: baseApproved });
console.log('START:', cmsServerStorage.getRelease(id)?.canonicalLyrics?.status, cmsServerStorage.getRelease(id)?.canonicalLyrics?.approvedAt);

const bodyA = {
  canonicalLyrics: {
    ...baseApproved,
    languages: ['ur', 'en'],
    status: 'APPROVED',
    approvedAt: '2026-09-02T10:00:00.000Z',
    approvedBy: 'admin_1'
  }
};
mockApiPut(id, bodyA);
console.log('RESULT:');
console.log(cmsServerStorage.getRelease(id)?.canonicalLyrics);

console.log('\n--- TEST B: Change only primaryLanguage ---');
mockApiPut(id, { canonicalLyrics: baseApproved });
console.log('START:', cmsServerStorage.getRelease(id)?.canonicalLyrics?.status, cmsServerStorage.getRelease(id)?.canonicalLyrics?.approvedAt);

const bodyB = {
  canonicalLyrics: {
    ...baseApproved,
    primaryLanguage: 'en',
    status: 'APPROVED',
    approvedAt: '2026-09-02T10:00:00.000Z',
    approvedBy: 'admin_1'
  }
};
mockApiPut(id, bodyB);
console.log('RESULT:');
console.log(cmsServerStorage.getRelease(id)?.canonicalLyrics);

mockApiPut(id, {
  canonicalLyrics: {
    text: 'Kise dhoond raha hai shehron ki gard mein?\nJise sadiyon se pukaar raha hai,\nwo teri hi saans mein hai.\n\nTu aainon mein chehra padhta raha,\nrooh ki tehreer na padh saka.\n\nTu ne har sawaal ka jawaab likha,\nbas main kaun hoon adhoora chhoda.\n\nJab parde girenge, chehre nahi bachenge.\nJab naam mitenge, rutbe nahi bachenge.\nEk hi sawaal bachega...\nkya tu ne khud ko pehchaana?\n\nKabhi kabhi Rabb tujhe tujhse milaane ko\ntujhse sab chheen leta hai.',
    primaryLanguage: 'ur',
    languages: ['ur'],
    source: 'YOUTUBE_DESCRIPTION_EXTRACTION',
    status: 'DRAFT'
  }
});
