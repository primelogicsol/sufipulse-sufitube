import { applyCanonicalLyricsWorkflow } from './server/services/canonical-lyrics-workflow';
import * as assert from 'assert';

console.log('Running test-lyrics-workflow assertions...');

const now = new Date().toISOString();
const actorId = 'user_123';

const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

// 1. new lyrics -> DRAFT
const res1 = applyCanonicalLyricsWorkflow(null, { text: 'lyrics', status: 'REVIEWED' }, actorId, now);
assert.strictEqual(res1.status, 'DRAFT');
assert.strictEqual(res1.primaryLanguage, 'ur');
assert.deepStrictEqual(res1.languages, ['ur']);

// 2. DRAFT -> REVIEWED
const draft = clone(res1);
const req2 = clone(draft);
req2.status = 'REVIEWED';
const res2 = applyCanonicalLyricsWorkflow(draft, req2, actorId, now);
assert.strictEqual(res2.status, 'REVIEWED');
assert.strictEqual(res2.reviewedBy, actorId);
assert.strictEqual(res2.reviewedAt, now);

// 3. REVIEWED -> APPROVED
const reviewed = clone(res2);
const req3 = clone(reviewed);
req3.status = 'APPROVED';
const later = new Date(Date.now() + 1000).toISOString();
const res3 = applyCanonicalLyricsWorkflow(reviewed, req3, 'admin_999', later);
assert.strictEqual(res3.status, 'APPROVED');
assert.strictEqual(res3.approvedBy, 'admin_999');
assert.strictEqual(res3.approvedAt, later);
assert.strictEqual(res3.reviewedBy, actorId);
assert.strictEqual(res3.reviewedAt, now);

// 4. DRAFT -> APPROVED rejected
const req4 = clone(draft);
req4.status = 'APPROVED';
const res4 = applyCanonicalLyricsWorkflow(draft, req4, actorId, now);
assert.strictEqual(res4.status, 'DRAFT');

// 5. APPROVED text edit -> DRAFT
const approved = clone(res3);
const req5 = clone(approved);
req5.text = 'edited lyrics';
const res5 = applyCanonicalLyricsWorkflow(approved, req5, actorId, now);
assert.strictEqual(res5.status, 'DRAFT');
assert.strictEqual(res5.reviewedAt, undefined);
assert.strictEqual(res5.approvedAt, undefined);

// 6. APPROVED primaryLanguage edit -> DRAFT
const req6 = clone(approved);
req6.primaryLanguage = 'en';
const res6 = applyCanonicalLyricsWorkflow(approved, req6, actorId, now);
assert.strictEqual(res6.status, 'DRAFT');
assert.strictEqual(res6.reviewedAt, undefined);

// 7. APPROVED languages[] edit -> DRAFT
const req7 = clone(approved);
req7.languages = ['ur', 'en'];
const res7 = applyCanonicalLyricsWorkflow(approved, req7, actorId, now);
assert.strictEqual(res7.status, 'DRAFT');
assert.strictEqual(res7.reviewedAt, undefined);

// 8. explicit demotion -> DRAFT
const req8 = clone(approved);
req8.status = 'DRAFT';
const res8 = applyCanonicalLyricsWorkflow(approved, req8, actorId, now);
assert.strictEqual(res8.status, 'DRAFT');
assert.strictEqual(res8.reviewedAt, undefined);
assert.strictEqual(res8.approvedAt, undefined);

// 9. fabricated reviewedAt/reviewedBy stripped
const req9 = clone(draft);
req9.reviewedAt = 'fake_time';
req9.reviewedBy = 'hacker';
const res9 = applyCanonicalLyricsWorkflow(draft, req9, actorId, now);
assert.strictEqual(res9.status, 'DRAFT');
assert.strictEqual(res9.reviewedAt, undefined);
assert.strictEqual(res9.reviewedBy, undefined);

// 10. fabricated approvedAt/approvedBy stripped
const req10 = clone(reviewed);
req10.approvedAt = 'fake_time';
req10.approvedBy = 'hacker';
const res10 = applyCanonicalLyricsWorkflow(reviewed, req10, actorId, now);
assert.strictEqual(res10.status, 'REVIEWED');
assert.strictEqual(res10.approvedAt, undefined);
assert.strictEqual(res10.approvedBy, undefined);

console.log('All workflow assertions PASSED.');
