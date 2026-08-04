/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(repositoryRoot, 'dist-mobile');
const source = path.join(outputDirectory, 'hyperionMobileReactNative.js');
const nativeVariant = path.join(
  outputDirectory,
  'hyperionMobileReactNative.react.native.js'
);

fs.copyFileSync(source, nativeVariant);

const flowSource = `${source}.flow`;
if (fs.existsSync(flowSource)) {
  for (const suffix of ['.react.flow', '.react.native.flow']) {
    fs.copyFileSync(
      flowSource,
      path.join(outputDirectory, `hyperionMobileReactNative${suffix}`)
    );
  }
}

for (const buildEntry of ['mobile.js', 'mobile.js.map']) {
  fs.rmSync(path.join(outputDirectory, buildEntry), { force: true });
}

const artifacts = fs
  .readdirSync(outputDirectory)
  .filter((name) => /^hyperionMobile.*\.js$/.test(name));
const artifactSet = new Set(artifacts);

for (const artifact of artifacts) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  const imports = code.matchAll(
    /(?:from\s+|import\s+)['"](hyperionMobile[^'"]+)['"]/g
  );
  for (const [, importedModule] of imports) {
    if (!artifactSet.has(`${importedModule}.js`)) {
      throw new Error(
        `${artifact} imports missing artifact ${importedModule}.js`
      );
    }
  }
}

const reactNativeArtifacts = artifacts.filter((artifact) =>
  artifact.startsWith('hyperionMobileReactNative')
);
for (const artifact of reactNativeArtifacts) {
  const code = fs.readFileSync(path.join(outputDirectory, artifact), 'utf8');
  for (const forbiddenDependency of [
    'hyperionMobileCore',
    'hyperionMobileReact',
  ]) {
    const dependencyPattern = new RegExp(
      `(?:from\\s+|import\\s+)['"](?:[.]\\/)?${forbiddenDependency}(?:[.]js)?['"]`
    );
    if (dependencyPattern.test(code)) {
      const message = `${artifact} depends on forbidden module ${forbiddenDependency}`;
      throw new Error(message);
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
