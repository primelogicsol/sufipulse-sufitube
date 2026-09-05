import { toPublicRelease } from './server/storage/release-dto';
import * as assert from 'assert';

console.log('Running synthetic privacy assertions...');

const makeSynthetic = (status: string) => ({
  id: 'synthetic-1',
  slug: 'synthetic-1',
  title: 'Test',
  canonicalLyrics: {
    text: 'secret lyrics',
    status: status,
    languages: ['ur'],
    reviewedBy: 'editor_1',
    approvedBy: 'admin_1'
  }
});

for (const status of ['DRAFT', 'REVIEWED', 'APPROVED']) {
  const release = makeSynthetic(status);
  const publicDTO = toPublicRelease(release as any);
  assert.strictEqual((publicDTO as any).canonicalLyrics, undefined, 'canonicalLyrics leaked in ' + status);
  assert.strictEqual((publicDTO as any).reviewedBy, undefined);
  assert.strictEqual((publicDTO as any).approvedBy, undefined);
}

console.log('Privacy assertions PASSED.');
