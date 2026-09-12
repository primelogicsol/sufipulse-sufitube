const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('@swc/core');

function compileAndRequire(filepath) {
  const source = fs.readFileSync(filepath, 'utf8');
  const transformed = swc.transformSync(source, {
    filename: filepath,
    jsc: {
      parser: { syntax: 'typescript' },
      target: 'es2022',
    },
    module: { type: 'commonjs' },
  });
  
  const executable = transformed.code.replace(/require\(["']server-only["']\);?/g, '');
  const mod = new Module(filepath, module);
  mod.filename = filepath;
  mod.paths = Module._nodeModulePaths(path.dirname(filepath));
  mod._compile(executable, filepath);
  return mod.exports;
}

require('dotenv').config({ path: '.env.private-production-test' });

const alignmentModule = compileAndRequire(path.join(process.cwd(), 'server', 'integrations', 'private-audio-alignment.ts'));
const { fetchConfiguredPrivateAudioAlignment, normalizePrivateAudioAlignment } = alignmentModule;

async function testLiveSuno() {
  const assetId = process.argv[2];
  if (!assetId) {
    console.error("Please provide a Suno asset ID: node test-live-suno.cjs <ASSET_ID>");
    process.exit(1);
  }

  console.log(`Testing Live Suno Connection for Asset ID: ${assetId}`);
  console.log(`URL Template: ${process.env.PRIVATE_AUDIO_ALIGNMENT_URL_TEMPLATE || 'MISSING'}`);
  
  try {
    const rawPayload = await fetchConfiguredPrivateAudioAlignment(assetId);
    console.log("âœ… Successfully fetched raw payload.");
    
    try {
      const normalized = normalizePrivateAudioAlignment(rawPayload, assetId);
      console.log("âœ… Successfully normalized payload!");
      console.log(`Stats: ${normalized.stats.wordCount} words, ${normalized.stats.lineCount} lines, ${normalized.stats.waveformPointCount} waveform points, ${normalized.durationSeconds}s duration`);
    } catch(err) {
      console.error("â Œ Normalization failed:", err.message);
    }
  } catch(err) {
    console.error("â Œ Fetch failed:", err.message);
  }
}

testLiveSuno();
