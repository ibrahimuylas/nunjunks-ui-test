const fs = require('node:fs');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const demoSessionService = require('../../src/app/services/demo-session-service');

const appRoot = path.join(__dirname, '..', '..', 'src', 'app');
const demoSourceRoots = [
  path.join(appRoot, 'controllers', 'demo'),
  path.join(appRoot, 'validators', 'demo'),
  path.join(appRoot, 'view-models', 'demo'),
];
const demoSourceFiles = [
  path.join(appRoot, 'routes', 'demo-routes.js'),
  path.join(appRoot, 'services', 'journey-service.js'),
  ...fs
    .readdirSync(path.join(appRoot, 'services'))
    .filter((filename) => filename.startsWith('demo-') && filename.endsWith('.js'))
    .map((filename) => path.join(appRoot, 'services', filename)),
  ...fs
    .readdirSync(path.join(appRoot, 'config'))
    .filter((filename) => filename.startsWith('demo-') && filename.endsWith('.js'))
    .map((filename) => path.join(appRoot, 'config', filename)),
];

const permittedRuntimeDependencies = new Set([
  'express',
  'multer',
  'node:crypto',
  'node:url',
  'node:util',
  'path',
  'url',
]);
const outboundInvocationPatterns = [
  ['dynamic require', /\brequire\s*\(\s*[^'"\s]/u],
  ['dynamic import', /\bimport\s*\(/u],
  ['fetch', /\bfetch\s*\(/u],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/u],
  ['WebSocket', /\bWebSocket\b/u],
  ['EventSource', /\bEventSource\b/u],
  ['sendBeacon', /\.sendBeacon\s*\(/u],
];

function listJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listJavaScriptFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

function sourceDependencies(source) {
  const dependencies = [];
  const dependencyPatterns = [
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gu,
    /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gu,
  ];

  dependencyPatterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      dependencies.push(match[1]);
    }
  });

  return dependencies;
}

function resolveLocalDependency(fromFile, dependency) {
  const unresolvedPath = path.resolve(path.dirname(fromFile), dependency);
  const candidates = [
    unresolvedPath,
    `${unresolvedPath}.js`,
    path.join(unresolvedPath, 'index.js'),
  ];
  const resolvedPath = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );

  if (!resolvedPath) {
    throw new Error(`Could not resolve ${dependency} from ${path.relative(appRoot, fromFile)}`);
  }

  return resolvedPath;
}

function collectDemoDependencyGraph() {
  const pendingFiles = [...demoSourceFiles, ...demoSourceRoots.flatMap(listJavaScriptFiles)];
  const sourceByFile = new Map();

  while (pendingFiles.length > 0) {
    const file = pendingFiles.pop();

    if (sourceByFile.has(file)) {
      continue;
    }

    const source = fs.readFileSync(file, 'utf8');
    sourceByFile.set(file, source);

    sourceDependencies(source)
      .filter((dependency) => dependency.startsWith('.'))
      .forEach((dependency) => pendingFiles.push(resolveLocalDependency(file, dependency)));
  }

  return sourceByFile;
}

describe('demo privacy source boundaries', () => {
  test('rejects uploaded byte containers at the normalized session boundary', () => {
    const uploadedBytes = Buffer.from('PRIVATE-UPLOAD-BYTES-MUST-NOT-ENTER-SESSION');
    const session = {};

    expect(() =>
      demoSessionService.saveSupportValue(session, 'evidence', {
        filename: 'safe-filename.pdf',
        buffer: uploadedBytes,
      }),
    ).toThrow('Demo session entries must be normalized JSON values');
    expect(demoSessionService.getSupportState(session)).toEqual({
      values: {},
      completion: {},
    });
    expect(JSON.stringify(session)).not.toContain(uploadedBytes.toString());
  });

  test('uses only reviewed non-outbound dependencies and contains no transport invocation', () => {
    const sourceByFile = collectDemoDependencyGraph();
    const unapprovedDependencies = [];
    const outboundInvocations = [];

    sourceByFile.forEach((source, file) => {
      const relativeFile = path.relative(appRoot, file);

      sourceDependencies(source)
        .filter((dependency) => !dependency.startsWith('.'))
        .filter((dependency) => !permittedRuntimeDependencies.has(dependency))
        .forEach((dependency) => unapprovedDependencies.push(`${relativeFile}: ${dependency}`));

      outboundInvocationPatterns.forEach(([name, pattern]) => {
        if (pattern.test(source)) {
          outboundInvocations.push(`${relativeFile}: ${name}`);
        }
      });
    });

    expect(unapprovedDependencies).toEqual([]);
    expect(outboundInvocations).toEqual([]);
  });
});
