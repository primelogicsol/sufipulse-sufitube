const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('@swc/core');

const sourcePath = path.join(process.cwd(), 'server', 'integrations', 'private-audio-alignment.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const transformed = swc.transformSync(source, {
  filename: sourcePath,
  jsc: {
    parser: { syntax: 'typescript' },
    target: 'es2022',
  },
  module: { type: 'commonjs' },
});

// `server-only` is a framework boundary marker. The smoke test evaluates the
// pure normalizer in Node, so the marker itself is intentionally removed here.
const executable = transformed.code.replace(/require\(["']server-only["']\);?/g, '');
const mod = new Module(sourcePath, module);
mod.filename = sourcePath;
mod.paths = Module._nodeModulePaths(path.dirname(sourcePath));
mod._compile(executable, sourcePath);

const {
  normalizePrivateAudioAlignment,
  extractSourceAssetId,
  isProductionDirection,
} = mod.exports;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fixture = {
  aligned_lyrics: [
    {
      text: 'Safar mein musafir...',
      start_s: 1.436,
      end_s: 3.271,
      section: 'verse',
      words: [
        { text: 'Safar', start_s: 1.436, end_s: 1.9 },
        { text: 'mein', start_s: 1.91, end_s: 2.2 },
        { text: 'musafir', start_s: 2.21, end_s: 3.271 },
      ],
    },
    {
      text: '[Production direction]',
      start_s: 3.1,
      end_s: 4.0,
      section: 'other',
      words: [],
    },
    {
      text: 'Kaun reh gaya',
      start_s: 3.989,
      end_s: 5.346,
      section: 'verse',
      words: [],
    },
  ],
  aligned_words: [
    { text: 'Safar', start_s: 1.436, end_s: 1.9 },
    { text: 'mein', start_s: 1.91, end_s: 2.2 },
    { text: 'musafir', start_s: 2.21, end_s: 3.271 },
    { text: 'Kaun', start_s: 3.989, end_s: 4.4 },
    { text: 'reh', start_s: 4.41, end_s: 4.7 },
    { text: 'gaya', start_s: 4.71, end_s: 5.346 },
  ],
  waveform_data: [0.1, 0.2, 0.15, 0.3],
  hoot_cer: 0.5224,
  is_streamed: false,
  duration: 5.346,
  authorization: 'must-not-survive',
  nested: {
    browser_token: 'must-not-survive',
    safe_field: 'retained',
  },
};

const result = normalizePrivateAudioAlignment(fixture);

assert(result.stats.lineCount === 3, 'Expected three timed lines');
assert(result.stats.publishableLineCount === 2, 'Expected two publishable lines');
assert(result.stats.productionDirectionCount === 1, 'Expected one production direction');
assert(result.stats.wordCount === 6, 'Expected top-level aligned words to be retained');
assert(result.stats.waveformPointCount === 4, 'Expected waveform points to be retained');
assert(result.stats.overlapCount === 2, 'Expected overlapping transitions to be reported, not rewritten');
assert(result.alignmentQuality === 0.5224, 'Expected alignment metric normalization');
assert(result.isStreamed === false, 'Expected stream flag normalization');
assert(result.durationSeconds === 5.346, 'Expected duration normalization');
assert(result.sourceMetadata.authorization === '[redacted]', 'Authorization metadata must be redacted');
assert(result.sourceMetadata.nested.browser_token === '[redacted]', 'Nested token metadata must be redacted');
assert(result.sourceMetadata.nested.safe_field === 'retained', 'Non-sensitive metadata should remain available privately');
assert(typeof result.payloadHash === 'string' && result.payloadHash.length === 64, 'Expected SHA-256 payload hash');
assert(isProductionDirection('(Production direction)') === true, 'Parenthesized production direction should be detected');
assert(isProductionDirection('Actual lyric') === false, 'Normal lyric should remain publishable');
assert(
  extractSourceAssetId('https://private.example/song/67ddd469-78e2-4efa-8b7a-640d2bd15044') === '67ddd469-78e2-4efa-8b7a-640d2bd15044',
  'Expected source asset ID extraction from private URL'
);

console.log('Private audio alignment smoke test: PASS');
console.log(JSON.stringify({
  lineCount: result.stats.lineCount,
  publishableLineCount: result.stats.publishableLineCount,
  productionDirectionCount: result.stats.productionDirectionCount,
  overlapCount: result.stats.overlapCount,
  wordCount: result.stats.wordCount,
  waveformPointCount: result.stats.waveformPointCount,
  alignmentQuality: result.alignmentQuality,
  isStreamed: result.isStreamed,
}, null, 2));
