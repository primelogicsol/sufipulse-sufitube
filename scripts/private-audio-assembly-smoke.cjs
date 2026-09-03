const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('@swc/core');

const sourcePath = path.join(process.cwd(), 'server', 'integrations', 'private-audio-assembly.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const transformed = swc.transformSync(source, {
  filename: sourcePath,
  jsc: {
    parser: { syntax: 'typescript' },
    target: 'es2022',
  },
  module: { type: 'commonjs' },
});

const executable = transformed.code.replace(/require\(["']server-only["']\);?/g, '');
const mod = new Module(sourcePath, module);
mod.filename = sourcePath;
mod.paths = Module._nodeModulePaths(path.dirname(sourcePath));
mod._compile(executable, sourcePath);

const {
  compilePrivateAudioAssembly,
  isAssemblyDirectStreamCompatible,
} = mod.exports;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const alignment = (durationSeconds, lines) => ({
  lines,
  words: lines.flatMap((line) => line.words || []),
  waveformData: [],
  durationSeconds,
  sourceMetadata: {},
  payloadHash: 'fixture',
  stats: {
    lineCount: lines.length,
    publishableLineCount: lines.filter((line) => !line.isProductionDirection).length,
    productionDirectionCount: lines.filter((line) => line.isProductionDirection).length,
    wordCount: lines.flatMap((line) => line.words || []).length,
    waveformPointCount: 0,
    overlapCount: 0,
  },
});

const alignments = {
  clip_A: alignment(10, [
    {
      index: 1,
      text: 'Opening line',
      startSeconds: 1,
      endSeconds: 3,
      isProductionDirection: false,
      words: [{ text: 'Opening', startSeconds: 1, endSeconds: 2 }],
    },
    {
      index: 2,
      text: 'Shared transition line',
      startSeconds: 8,
      endSeconds: 10,
      isProductionDirection: false,
      words: [],
    },
  ]),
  clip_B: alignment(8, [
    {
      index: 1,
      text: 'Shared transition line',
      startSeconds: 0,
      endSeconds: 2,
      isProductionDirection: false,
      words: [],
    },
    {
      index: 2,
      text: 'Extension lyric',
      startSeconds: 2,
      endSeconds: 4,
      isProductionDirection: false,
      words: [{ text: 'Extension', startSeconds: 2, endSeconds: 3 }],
    },
    {
      index: 3,
      text: '(Instrumental direction)',
      startSeconds: 4,
      endSeconds: 6,
      isProductionDirection: true,
      words: [],
    },
  ]),
};

const definition = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  segments: [
    {
      segmentId: 'segment-a',
      sourceAssetId: 'clip_A',
      role: 'primary',
      order: 1,
      sourceInSeconds: 0,
      sourceOutSeconds: 9,
      destinationStartSeconds: 0,
      transition: { type: 'cut' },
    },
    {
      segmentId: 'segment-b',
      sourceAssetId: 'clip_B',
      role: 'extension',
      parentSourceAssetId: 'clip_A',
      order: 2,
      sourceInSeconds: 1,
      sourceOutSeconds: 6,
      destinationStartSeconds: 7.5,
      transition: { type: 'crossfade', durationSeconds: 1.5 },
      excludedSourceLineIndexes: [1],
    },
  ],
};

const result = compilePrivateAudioAssembly(definition, alignments);

assert(result.stats.segmentCount === 2, 'Expected two enabled assembly segments');
assert(result.stats.sourceCount === 2, 'Expected two distinct source clips');
assert(result.stats.lineCount === 3, 'Expected three retained candidate lines');
assert(result.stats.publishableLineCount === 2, 'Expected two publishable retained lines');
assert(result.stats.productionDirectionCount === 1, 'Expected one retained production direction');
assert(result.stats.excludedLineCount === 1, 'Expected duplicate extension line to be explicitly excluded');
assert(result.stats.clippedLineCount === 1, 'Expected one line clipped by the source-out edit point');
assert(result.stats.overlapCount === 1, 'Expected crossfade timing overlap to be preserved and reported');
assert(Math.abs(result.durationSeconds - 12.5) < 0.0001, 'Expected assembly duration to use destination offsets');

const opening = result.lines.find((line) => line.text === 'Opening line');
const shared = result.lines.find((line) => line.text === 'Shared transition line');
const extension = result.lines.find((line) => line.text === 'Extension lyric');

assert(opening && opening.startSeconds === 1 && opening.endSeconds === 3, 'Primary timing should remain unchanged');
assert(shared && shared.startSeconds === 8 && shared.endSeconds === 9, 'Primary transition line should be clipped at source-out');
assert(extension && extension.startSeconds === 8.5 && extension.endSeconds === 10.5, 'Extension timing should be transformed into master time');
assert(extension && extension.sourceStartSeconds === 2, 'Source-local timing must remain available for provenance');
assert(extension && extension.words[0].startSeconds === 8.5, 'Nested word timing should receive the same assembly transform');

assert(
  isAssemblyDirectStreamCompatible(undefined, 'clip_A', 10) === true,
  'No assembly should remain compatible with the existing direct stream path',
);
assert(
  isAssemblyDirectStreamCompatible({
    version: 1,
    updatedAt: new Date(0).toISOString(),
    segments: [{
      segmentId: 'single',
      sourceAssetId: 'clip_A',
      role: 'primary',
      order: 1,
      sourceInSeconds: 0,
      destinationStartSeconds: 0,
      transition: { type: 'cut' },
    }],
  }, 'clip_A', 10) === true,
  'One untouched primary segment should remain directly streamable',
);
assert(
  isAssemblyDirectStreamCompatible(definition, 'clip_A', 10) === false,
  'Multi-clip/crossfade assembly must not masquerade as one direct public stream',
);

console.log('Private audio assembly smoke test: PASS');
console.log(JSON.stringify({
  assemblyVersion: result.assemblyVersion,
  durationSeconds: result.durationSeconds,
  stats: result.stats,
  directStreamCompatible: isAssemblyDirectStreamCompatible(definition, 'clip_A', 10),
  retainedLines: result.lines.map((line) => ({
    segmentId: line.segmentId,
    sourceLineIndex: line.sourceLineIndex,
    sourceStartSeconds: line.sourceStartSeconds,
    startSeconds: line.startSeconds,
    endSeconds: line.endSeconds,
    text: line.text,
  })),
}, null, 2));
