const fs = require('node:fs');

const route = fs.readFileSync('app/api/admin/releases/[id]/audio-assembly/route.ts', 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const start = route.indexOf('const subtitleCues =');
const end = route.indexOf('const updated =', start);
assert(start >= 0 && end > start, 'Could not locate canonical caption write block.');

const canonicalWriteBlock = route.slice(start, end);

assert(
  canonicalWriteBlock.includes('lineRef: `studio-master:${index + 1}`'),
  'Canonical cue lineRef must remain opaque and Studio-owned.'
);
assert(
  !canonicalWriteBlock.includes('sourceAssetId'),
  'Private source asset IDs must never be written into canonical CMS cues/metadata.'
);
assert(
  !canonicalWriteBlock.includes('segmentId'),
  'Private assembly segment IDs must never be written into canonical CMS cues/metadata.'
);
assert(
  !canonicalWriteBlock.includes('sourceLineIndex'),
  'Private source line indexes must never be written into canonical CMS cues/metadata.'
);
assert(
  !canonicalWriteBlock.includes('timingSourceMode'),
  'Private production timing provenance must remain outside canonical CMS cue metadata.'
);
assert(
  !canonicalWriteBlock.includes('assemblySegment'),
  'Private assembly segment provenance must remain outside canonical CMS cue metadata.'
);
assert(
  !canonicalWriteBlock.includes('clippedAtAssembly'),
  'Private edit-point provenance must remain outside canonical CMS cue metadata.'
);

// The admin response may report assemblyVersion to the authenticated Studio
// operator, but the canonical write block must not serialize that provenance.
assert(
  !canonicalWriteBlock.includes('assemblyVersion:'),
  'Assembly version must not be serialized into canonical CMS cue metadata.'
);

console.log('Private audio assembly provenance firewall smoke test: PASS');
