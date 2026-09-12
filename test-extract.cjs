const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const swc = require('@swc/core');

function compileAndRequire(filepath) {
  const source = fs.readFileSync(filepath, 'utf8');
  const transformed = swc.transformSync(source, {
    filename: filepath,
    jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
    module: { type: 'commonjs' },
  });
  const executable = transformed.code.replace(/require\(["']server-only["']\);?/g, '');
  const mod = new Module(filepath, module);
  mod.filename = filepath;
  mod.paths = Module._nodeModulePaths(path.dirname(filepath));
  mod._compile(executable, filepath);
  return mod.exports;
}

const mod = compileAndRequire(path.join(process.cwd(), 'server', 'integrations', 'private-audio-alignment.ts'));
console.log(mod.extractSourceAssetId("https://suno.com/song/38c56104-09ee-476a-bab9-733baf6bfe33"));
