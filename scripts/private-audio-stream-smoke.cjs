const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('@swc/core');

const sourcePath = path.join(process.cwd(), 'server', 'integrations', 'private-audio-stream.ts');
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
  normalizeSingleRangeHeader,
  buildSafeAudioProxyHeaders,
} = mod.exports;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(normalizeSingleRangeHeader(null) === undefined, 'Missing Range header should remain undefined');
assert(normalizeSingleRangeHeader('bytes=0-') === 'bytes=0-', 'Open-ended byte range should be accepted');
assert(normalizeSingleRangeHeader('bytes=100-200') === 'bytes=100-200', 'Bounded byte range should be accepted');
assert(normalizeSingleRangeHeader('bytes=-500') === 'bytes=-500', 'Suffix byte range should be accepted');

let rejectedMultiRange = false;
try {
  normalizeSingleRangeHeader('bytes=0-10,20-30');
} catch {
  rejectedMultiRange = true;
}
assert(rejectedMultiRange, 'Multiple ranges must be rejected');

const upstream = new Response(null, {
  status: 206,
  headers: {
    'Content-Type': 'audio/mpeg',
    'Content-Length': '1234',
    'Content-Range': 'bytes 0-1233/9000',
    'Accept-Ranges': 'bytes',
    'Set-Cookie': 'provider-session=secret',
    'Location': 'https://private-provider.example/audio',
    'X-Provider-Secret': 'secret',
  },
});

const safe = buildSafeAudioProxyHeaders(upstream);
assert(safe.get('Content-Type') === 'audio/mpeg', 'Content-Type should be forwarded');
assert(safe.get('Content-Length') === '1234', 'Content-Length should be forwarded');
assert(safe.get('Content-Range') === 'bytes 0-1233/9000', 'Content-Range should be forwarded');
assert(safe.get('Accept-Ranges') === 'bytes', 'Accept-Ranges should be forwarded');
assert(safe.get('Set-Cookie') === null, 'Provider cookies must never be forwarded');
assert(safe.get('Location') === null, 'Provider redirect location must never be forwarded');
assert(safe.get('X-Provider-Secret') === null, 'Unknown provider headers must never be forwarded');
assert(safe.get('Cache-Control').includes('no-store'), 'Relay response must be no-store');
assert(safe.get('Content-Disposition') === 'inline', 'Relay response must be inline, not attachment');

console.log('Private audio stream smoke test: PASS');
