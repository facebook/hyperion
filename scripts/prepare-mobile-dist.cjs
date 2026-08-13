/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  getRuntimeSpecifiers,
  getNativeArtifactName,
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

for (const buildEntry of ['mobile.js', 'mobile.js.map']) {
  fs.rmSync(path.join(outputDirectory, buildEntry), { force: true });
}

const artifacts = fs
  .readdirSync(outputDirectory)
  .filter((name) => /^hyperionMobile.*\.js$/.test(name));
const artifactSet = new Set(artifacts);

const requiredEntries = [
  ...NATIVE_ONLY_ARTIFACTS.map(getNativeArtifactName),
  ...PORTABLE_NATIVE_ALIASES,
  ...PORTABLE_NATIVE_ALIASES.map(getNativeArtifactName),
  'hyperionMobileReactNativeJSXObservation.js',
  'hyperionMobileReactNativeLegacyRuntimeInstaller.js',
];
for (const artifact of requiredEntries) {
  if (!artifactSet.has(artifact)) {
    throw new Error(`Missing React Native entry artifact: ${artifact}`);
  }
}

for (const artifact of artifacts) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  const imports = getRuntimeSpecifiers(code);
  for (const importedModule of imports) {
    if (importedModule.startsWith('./hyperionMobile')) {
      throw new Error(
        `${artifact} contains relative Haste import ${importedModule}`
      );
    }
    if (!importedModule.startsWith('hyperionMobile')) continue;
    if (importedModule.endsWith('.js')) {
      throw new Error(
        `${artifact} contains extension-qualified Haste import ${importedModule}`
      );
    }
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
}

const reactNativeArtifacts = artifacts.filter((artifact) =>
  artifact.startsWith('hyperionMobileReactNative')
);
for (const artifact of reactNativeArtifacts) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  const imports = getRuntimeSpecifiers(code);
  for (const forbiddenDependency of [
    'hyperionMobileCore',
    'hyperionMobileReact',
  ]) {
    if (imports.includes(forbiddenDependency)) {
      const message = `${artifact} depends on forbidden module ${forbiddenDependency}`;
      throw new Error(message);
    }
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
  const dependencies = getRuntimeSpecifiers(portableCode);
  for (const forbiddenDependency of [
    'react-native',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ]) {
    if (dependencies.includes(forbiddenDependency)) {
      throw new Error(
        `${portableArtifact} eagerly imports ${forbiddenDependency}`
      );
    }
  }
}

const mobileCore = fs.readFileSync(
  path.join(outputDirectory, 'hyperionMobileCore.js'),
  'utf8'
);
if (/\brequire\s*\(\s*['"]__debug['"]\s*\)/.test(mobileCore)) {
  throw new Error(
    'hyperionMobileCore.js contains a statically resolved __debug require'
  );
}
for (const domRuntime of [
  'window.document',
  'instanceof Node',
  'DOMShadowPrototype',
]) {
  if (mobileCore.includes(domRuntime)) {
    throw new Error(
      `hyperionMobileCore.js contains DOM runtime code: ${domRuntime}`
    );
  }
}

for (const generatedDirectory of [
  outputDirectory,
  path.join(repositoryRoot, 'packages/hyperion-react-native/dist'),
  path.join(repositoryRoot, 'packages/hyperion-autologging-shared/dist'),
]) {
  for (const generatedFile of fs.readdirSync(generatedDirectory)) {
    if (generatedFile.endsWith('.map')) {
      throw new Error(`Unexpected generated source map: ${generatedFile}`);
    }
    if (generatedFile.endsWith('.js')) {
      const code = fs.readFileSync(
        path.join(generatedDirectory, generatedFile),
        'utf8'
      );
      if (code.includes('sourceMappingURL=')) {
        throw new Error(
          `Unexpected sourceMappingURL in generated file: ${generatedFile}`
        );
      }
    }
  }
}
