const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { transformSync } = require('@swc/core');

const originalLoad = Module._load;
Module._load = function phase1Load(request, parent, isMain) {
  if (request === 'server-only') return {};
  if (request.startsWith('@/')) {
    const resolved = path.join(process.cwd(), request.slice(2));
    return originalLoad.call(this, resolved, parent, isMain);
  }
  return originalLoad.call(this, request, parent, isMain);
};

require.extensions['.ts'] = function compilePhase1TypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = transformSync(source, {
    filename,
    sourceMaps: 'inline',
    jsc: {
      target: 'es2022',
      parser: {
        syntax: 'typescript',
        tsx: false,
        decorators: false,
        dynamicImport: true,
      },
    },
    module: {
      type: 'commonjs',
      strict: true,
      strictMode: true,
      noInterop: false,
    },
  });
  module._compile(output.code, filename);
};
