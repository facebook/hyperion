/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const NATIVE_ONLY_ARTIFACTS = Object.freeze([
  'hyperionMobileReactNativeJSXRuntime.js',
  'hyperionMobileReactNativeJSXDevRuntime.js',
]);
const PORTABLE_NATIVE_ALIASES = Object.freeze(['hyperionMobileReactNative.js']);

function getNativeArtifactName(artifact) {
  return artifact.replace(/[.]js$/, '.react.native.js');
}

function rewriteHasteSpecifiers(code) {
  return code
    .replace(
      /\b((?:from\s+|import\s*(?:\(\s*)?))(['"])[.]\/(hyperionMobile[^'"]+)[.]js\2/g,
      '$1$2$3$2'
    )
    .replace(
      /\brequire\s*\(\s*(['"])[.]\/(hyperionMobile[^'"]+)[.]js\1\s*\)/g,
      'require($1$2$1)'
    );
}

function getRuntimeSpecifiers(code) {
  const specifiers = [];
  const importPattern = /\b(?:from\s+|import\s*(?:\(\s*)?)(['"])([^'"]+)\1/g;
  const requirePattern = /\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g;
  for (const match of code.matchAll(importPattern)) specifiers.push(match[2]);
  for (const match of code.matchAll(requirePattern)) specifiers.push(match[2]);
  return specifiers;
}

module.exports = {
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  getRuntimeSpecifiers,
  getNativeArtifactName,
  rewriteHasteSpecifiers,
};
