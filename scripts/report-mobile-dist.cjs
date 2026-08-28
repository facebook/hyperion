/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  REACT_NATIVE_MODERN_ENTRIES,
  REACT_NATIVE_PORTABLE_ENTRIES,
  getRuntimeSpecifiers,
} = require('./mobile-dist-utils.cjs');

const outputDirectory = path.resolve(__dirname, '..', 'dist-mobile');
const artifacts = fs
  .readdirSync(outputDirectory)
  .filter((name) => /^hyperionMobile.*[.]js$/.test(name))
  .sort()
  .map((name) => {
    const contents = fs.readFileSync(path.join(outputDirectory, name));
    return {
      name,
      bytes: contents.byteLength,
      sha256: crypto.createHash('sha256').update(contents).digest('hex'),
      imports: getRuntimeSpecifiers(contents.toString('utf8')),
    };
  });
const artifactByName = new Map(
  artifacts.map((artifact) => [artifact.name, artifact])
);
const conditionalEntries = REACT_NATIVE_PORTABLE_ENTRIES.map((entry) => {
  const closure = getArtifactClosure(entry);
  return {
    entry,
    transitiveBytes: closure.reduce(
      (total, artifact) => total + artifact.bytes,
      0
    ),
    artifacts: closure.map((artifact) => artifact.name),
  };
});
const conditionalCompositions = [
  ['runtime-only', ['hyperionMobileReactNativeRuntime.js']],
  [
    'runtime-with-ui-events',
    [
      'hyperionMobileReactNativeRuntime.js',
      'hyperionMobileReactNativeUIEvents.js',
    ],
  ],
  [
    'runtime-with-ui-events-and-surfaces',
    [
      'hyperionMobileReactNativeRuntime.js',
      'hyperionMobileReactNativeUIEvents.js',
      'hyperionMobileReactNativeSurfaces.js',
    ],
  ],
  ['complete-modern', REACT_NATIVE_MODERN_ENTRIES],
  ['compatibility', ['hyperionMobileReactNative.js']],
].map(([name, entries]) => {
  const closure = getArtifactClosure(entries);
  return {
    name,
    transitiveBytes: closure.reduce(
      (total, artifact) => total + artifact.bytes,
      0
    ),
    artifacts: closure.map((artifact) => artifact.name),
  };
});

console.log(
  JSON.stringify(
    { artifacts, conditionalEntries, conditionalCompositions },
    null,
    2
  )
);

function getArtifactClosure(entryOrEntries) {
  const result = [];
  const visited = new Set();
  const pending = Array.isArray(entryOrEntries)
    ? [...entryOrEntries]
    : [entryOrEntries];
  while (pending.length > 0) {
    const name = pending.pop();
    if (name == null || visited.has(name)) continue;
    const artifact = artifactByName.get(name);
    if (artifact == null) continue;
    visited.add(name);
    result.push(artifact);
    for (const specifier of artifact.imports) {
      const portable = `${specifier}.js`;
      const native = `${specifier}.react.native.js`;
      if (artifactByName.has(portable)) pending.push(portable);
      else if (artifactByName.has(native)) pending.push(native);
    }
  }
  return result.sort((left, right) => left.name.localeCompare(right.name));
}
