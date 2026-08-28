/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {
  LEGACY_CHANNEL_EXPORTS,
  LEGACY_RUNTIME_INSTALLER_ARTIFACT,
  LEGACY_RUNTIME_INSTALLER_DEPENDENCY,
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  REACT_NATIVE_CONVENIENCE_ARTIFACTS,
  REACT_NATIVE_PLUGIN_ARTIFACTS,
  REACT_NATIVE_PORTABLE_ENTRIES,
  getNativeArtifactName,
  getNamedExports,
  getRuntimeSpecifiers,
  getSideEffectImportSpecifiers,
  hasDefaultExport,
} = require('./mobile-dist-utils.cjs');

const repositoryRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(repositoryRoot, 'dist-mobile');

for (const artifact of NATIVE_ONLY_ARTIFACTS) {
  const source = path.join(outputDirectory, artifact);
  const nativeVariant = path.join(
    outputDirectory,
    getNativeArtifactName(artifact)
  );
  if (!fs.existsSync(source)) {
    throw new Error(`Missing native entry artifact: ${artifact}`);
  }
  fs.rmSync(nativeVariant, { force: true });
  fs.renameSync(source, nativeVariant);
}

for (const artifact of PORTABLE_NATIVE_ALIASES) {
  const source = path.join(outputDirectory, artifact);
  const nativeVariant = path.join(
    outputDirectory,
    getNativeArtifactName(artifact)
  );
  if (!fs.existsSync(source)) {
    throw new Error(`Missing portable entry artifact: ${artifact}`);
  }
  fs.copyFileSync(source, nativeVariant);
}

const artifacts = fs
  .readdirSync(outputDirectory)
  .filter((name) => /^hyperionMobile.*[.]js$/.test(name));
const artifactSet = new Set(artifacts);
const importsByArtifact = new Map(
  artifacts.map((artifact) => [
    artifact,
    getRuntimeSpecifiers(
      fs.readFileSync(path.join(outputDirectory, artifact), 'utf8')
    ),
  ])
);
const requiredEntries = [
  ...NATIVE_ONLY_ARTIFACTS.map(getNativeArtifactName),
  ...PORTABLE_NATIVE_ALIASES,
  ...PORTABLE_NATIVE_ALIASES.map(getNativeArtifactName),
  ...REACT_NATIVE_PORTABLE_ENTRIES,
  'hyperionMobileReactNativeJSXObservation.js',
  LEGACY_RUNTIME_INSTALLER_ARTIFACT,
];

for (const artifact of requiredEntries) {
  if (!artifactSet.has(artifact)) {
    throw new Error(`Missing React Native entry artifact: ${artifact}`);
  }
}

for (const artifact of REACT_NATIVE_PORTABLE_ENTRIES) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  if (!hasDefaultExport(code)) {
    throw new Error(`${artifact} must expose a default export`);
  }
}

const channelCode = fs.readFileSync(
  path.join(outputDirectory, 'hyperionMobileChannel.js'),
  'utf8'
);
const channelExports = getNamedExports(channelCode);
for (const legacyExport of LEGACY_CHANNEL_EXPORTS) {
  if (!channelExports.has(legacyExport)) {
    throw new Error(
      `hyperionMobileChannel.js must export legacy runtime ${legacyExport}`
    );
  }
}

const legacyInstallerImports = getRuntimeSpecifiers(
  fs.readFileSync(
    path.join(outputDirectory, LEGACY_RUNTIME_INSTALLER_ARTIFACT),
    'utf8'
  )
);
if (
  legacyInstallerImports.length !== 1 ||
  legacyInstallerImports[0] !== LEGACY_RUNTIME_INSTALLER_DEPENDENCY
) {
  throw new Error(
    `${LEGACY_RUNTIME_INSTALLER_ARTIFACT} must depend only on ${LEGACY_RUNTIME_INSTALLER_DEPENDENCY}`
  );
}

for (const artifact of artifacts) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  const imports = importsByArtifact.get(artifact) ?? [];
  const sideEffectImports = getSideEffectImportSpecifiers(code);
  if (sideEffectImports.length > 0) {
    throw new Error(
      `${artifact} contains side-effect-only imports: ${sideEffectImports.join(
        ', '
      )}`
    );
  }
  for (const importedModule of imports) {
    if (importedModule.startsWith('./')) {
      throw new Error(`${artifact} contains relative import ${importedModule}`);
    }
    if (
      importedModule.startsWith('hyperionMobile') &&
      importedModule.endsWith('.js')
    ) {
      throw new Error(
        `${artifact} contains extension-qualified Haste import ${importedModule}`
      );
    }
    if (!importedModule.startsWith('hyperionMobile')) continue;
    if (
      !artifactSet.has(`${importedModule}.js`) &&
      !artifactSet.has(`${importedModule}.react.native.js`)
    ) {
      throw new Error(`${artifact} imports missing artifact ${importedModule}`);
    }
  }
  if (!artifact.endsWith('.react.native.js')) {
    for (const nativeDependency of [
      'react-native',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ]) {
      if (imports.includes(nativeDependency)) {
        throw new Error(
          `${artifact} is generic but imports native dependency ${nativeDependency}`
        );
      }
    }
  }
  if (code.includes('sourceMappingURL=')) {
    throw new Error(
      `Unexpected sourceMappingURL in generated file: ${artifact}`
    );
  }
  if (/\brequire\s*\(\s*['"]__debug['"]\s*\)/.test(code)) {
    throw new Error(
      `${artifact} contains a statically resolved __debug require`
    );
  }
}

for (const artifact of artifacts.filter((name) =>
  name.startsWith('hyperionMobileReactNative')
)) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  const imports = getRuntimeSpecifiers(code);
  for (const forbiddenDependency of [
    'hyperionMobileCore',
    'hyperionMobileReact',
  ]) {
    if (imports.includes(forbiddenDependency)) {
      throw new Error(
        `${artifact} depends on forbidden module ${forbiddenDependency}`
      );
    }
  }
}

const pluginArtifactSet = new Set(REACT_NATIVE_PLUGIN_ARTIFACTS);
for (const entryArtifact of REACT_NATIVE_PORTABLE_ENTRIES) {
  const dependencies = getTransitiveArtifactDependencies(entryArtifact);
  if (dependencies.has('hyperionMobileReactNative.js')) {
    throw new Error(
      `${entryArtifact} imports the full React Native compatibility artifact`
    );
  }
  for (const importedArtifact of dependencies) {
    if (
      pluginArtifactSet.has(importedArtifact) &&
      importedArtifact !== entryArtifact &&
      !isAllowedPluginDependency(entryArtifact, importedArtifact)
    ) {
      throw new Error(
        `${entryArtifact} imports unrelated plugin artifact ${importedArtifact}`
      );
    }
  }
}

const compatibilityImports = new Set(
  importsByArtifact.get('hyperionMobileReactNative.js') ?? []
);
for (const pluginArtifact of REACT_NATIVE_PLUGIN_ARTIFACTS) {
  const pluginModule = pluginArtifact.replace(/[.]js$/, '');
  if (!compatibilityImports.has(pluginModule)) {
    throw new Error(
      `hyperionMobileReactNative.js must preserve ${pluginModule}`
    );
  }
}

for (const portableArtifact of PORTABLE_NATIVE_ALIASES) {
  const portableCode = fs.readFileSync(
    path.join(outputDirectory, portableArtifact),
    'utf8'
  );
  const nativeCode = fs.readFileSync(
    path.join(outputDirectory, getNativeArtifactName(portableArtifact)),
    'utf8'
  );
  if (nativeCode !== portableCode) {
    throw new Error(
      `${portableArtifact} and its native alias must be equivalent`
    );
  }
  for (const forbiddenDependency of [
    'react-native',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'hyperionMobileCore',
    'hyperionMobileReact',
  ]) {
    if (getRuntimeSpecifiers(portableCode).includes(forbiddenDependency)) {
      throw new Error(
        `${portableArtifact} eagerly imports ${forbiddenDependency}`
      );
    }
  }
  for (const [description, pattern] of [
    ['window.document', /\bwindow\s*[.]\s*document\b/],
    ['document query', /\bdocument\s*[.]\s*(?:querySelector|getElement)/],
    ['DOM instanceof', /\binstanceof\s+(?:Node|Element|Attr)\b/],
    ['DOMShadowPrototype', /\bDOMShadowPrototype\b/],
  ]) {
    if (pattern.test(portableCode)) {
      throw new Error(
        `${portableArtifact} contains DOM runtime code: ${description}`
      );
    }
  }
}

for (const entry of fs.readdirSync(outputDirectory)) {
  if (entry.endsWith('.map')) {
    throw new Error(`Unexpected generated source map: ${entry}`);
  }
}

const legacyRuntimeValidation = spawnSync(
  process.execPath,
  [path.join(repositoryRoot, 'scripts/validate-legacy-mobile-runtime.mjs')],
  {
    cwd: repositoryRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }
);
if (legacyRuntimeValidation.status !== 0) {
  throw new Error(
    `Legacy mobile runtime compatibility failed:\n${
      legacyRuntimeValidation.stderr || legacyRuntimeValidation.stdout
    }`
  );
}

function isAllowedPluginDependency(artifact, dependency) {
  return (
    (artifact === 'hyperionMobileReactNativeTransport.js' &&
      dependency === 'hyperionMobileReactNativeScreens.js') ||
    (REACT_NATIVE_CONVENIENCE_ARTIFACTS.includes(artifact) &&
      [
        'hyperionMobileReactNativeAppLifecycle.js',
        'hyperionMobileReactNativeHeartbeat.js',
        'hyperionMobileReactNativeAppStateEvents.js',
      ].includes(dependency)) ||
    ((artifact === 'hyperionMobileReactNativeHeartbeat.js' ||
      artifact === 'hyperionMobileReactNativeAppStateEvents.js') &&
      dependency === 'hyperionMobileReactNativeAppLifecycle.js')
  );
}

function getTransitiveArtifactDependencies(entryArtifact) {
  const result = new Set();
  const pending = [entryArtifact];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current == null) continue;
    for (const specifier of importsByArtifact.get(current) ?? []) {
      const dependency = resolveArtifact(specifier);
      if (dependency == null || dependency === entryArtifact) continue;
      if (result.has(dependency)) continue;
      result.add(dependency);
      pending.push(dependency);
    }
  }
  return result;
}

function resolveArtifact(specifier) {
  const portable = `${specifier}.js`;
  if (artifactSet.has(portable)) return portable;
  const native = `${specifier}.react.native.js`;
  return artifactSet.has(native) ? native : null;
}
