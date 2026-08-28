/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  getNativeArtifactName,
  getRuntimeSpecifiers,
  getSideEffectImportSpecifiers,
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
const requiredEntries = [
  ...NATIVE_ONLY_ARTIFACTS.map(getNativeArtifactName),
  ...PORTABLE_NATIVE_ALIASES,
  ...PORTABLE_NATIVE_ALIASES.map(getNativeArtifactName),
  'hyperionMobileReactNativeJSXObservation.js',
];

for (const artifact of requiredEntries) {
  if (!artifactSet.has(artifact)) {
    throw new Error(`Missing React Native entry artifact: ${artifact}`);
  }
}

for (const artifact of artifacts) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  const imports = getRuntimeSpecifiers(code);
  const sideEffectImports = getSideEffectImportSpecifiers(code);
  if (sideEffectImports.length > 0) {
    throw new Error(
      `${artifact} contains side-effect-only imports: ${sideEffectImports.join(
        ', '
      )}`
    );
  }
  for (const importedModule of imports) {
    if (importedModule.startsWith('./hyperionMobile')) {
      throw new Error(
        `${artifact} contains relative Haste import ${importedModule}`
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
}

for (const entry of fs.readdirSync(outputDirectory)) {
  if (entry.endsWith('.map')) {
    throw new Error(`Unexpected generated source map: ${entry}`);
  }
}
