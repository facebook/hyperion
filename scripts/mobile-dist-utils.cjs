/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const NATIVE_ONLY_ARTIFACTS = Object.freeze([
  'hyperionMobileReactNative.js',
  'hyperionMobileReactNativeJSXRuntime.js',
  'hyperionMobileReactNativeJSXDevRuntime.js',
]);

function getNativeArtifactName(artifact) {
  return artifact.replace(/[.]js$/, '.react.native.js');
}

function rewriteHasteSpecifiers(code) {
  return code.replace(
    /\b((?:from\s+|import\s*(?:\(\s*)?))(['"])[.]\/(hyperionMobile[^'"]+)[.]js\2/g,
    '$1$2$3$2'
  );
}

function getImportSpecifiers(code) {
  const specifiers = [];
  const pattern = /\b(?:from\s+|import\s*(?:\(\s*)?)(['"])([^'"]+)\1/g;
  for (const match of code.matchAll(pattern)) specifiers.push(match[2]);
  return specifiers;
}

module.exports = {
  NATIVE_ONLY_ARTIFACTS,
  getImportSpecifiers,
  getNativeArtifactName,
  rewriteHasteSpecifiers,
};
