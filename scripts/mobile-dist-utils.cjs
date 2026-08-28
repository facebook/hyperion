/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

const NATIVE_ONLY_ARTIFACTS = Object.freeze([
  'hyperionMobileReactNativeJSXRuntime.js',
  'hyperionMobileReactNativeJSXDevRuntime.js',
]);
const PORTABLE_NATIVE_ALIASES = Object.freeze(['hyperionMobileReactNative.js']);
const REACT_NATIVE_PLUGIN_ARTIFACTS = Object.freeze([
  'hyperionMobileReactNativeSurfaces.js',
  'hyperionMobileReactNativeUIEvents.js',
  'hyperionMobileReactNativeAppLifecycle.js',
  'hyperionMobileReactNativeHeartbeat.js',
  'hyperionMobileReactNativeAppStateEvents.js',
  'hyperionMobileReactNativeScreens.js',
  'hyperionMobileReactNativeListImpressions.js',
  'hyperionMobileReactNativeDeepLinks.js',
  'hyperionMobileReactNativeReactErrors.js',
]);
const REACT_NATIVE_CONVENIENCE_ARTIFACTS = Object.freeze([
  'hyperionMobileReactNativeLifecycle.js',
]);
const REACT_NATIVE_PORTABLE_ENTRIES = Object.freeze([
  'hyperionMobileReactNativeRuntime.js',
  ...REACT_NATIVE_PLUGIN_ARTIFACTS,
  ...REACT_NATIVE_CONVENIENCE_ARTIFACTS,
  'hyperionMobileReactNativeTransport.js',
]);
const REACT_NATIVE_MODERN_ENTRIES = Object.freeze([
  'hyperionMobileReactNativeRuntime.js',
  ...REACT_NATIVE_PLUGIN_ARTIFACTS,
  'hyperionMobileReactNativeTransport.js',
]);
const LEGACY_RUNTIME_INSTALLER_ARTIFACT =
  'hyperionMobileReactNativeLegacyRuntimeInstaller.js';
const LEGACY_RUNTIME_INSTALLER_DEPENDENCY =
  'hyperionMobileReactNativeJSXObservation';
const LEGACY_CHANNEL_EXPORTS = Object.freeze([
  'Channel',
  'Hook',
  'PausableChannel',
  'PipeableEmitter',
  'ResilientChannel',
]);

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

function getSideEffectImportSpecifiers(code) {
  return Array.from(
    code.matchAll(/^[ \t]*import[ \t]*(['\"])([^'\"]+)\1[ \t]*;?[ \t]*$/gm),
    (match) => match[2]
  );
}

function hasDefaultExport(code) {
  return (
    /\bexport\s+default\b/.test(code) ||
    /\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/s.test(code)
  );
}

function getNamedExports(code) {
  const exports = new Set();
  for (const match of code.matchAll(/\bexport\s*\{([^}]*)\}/gs)) {
    for (const item of match[1].split(',')) {
      const names = item.trim().split(/\s+as\s+/);
      const name = names[names.length - 1]?.trim();
      if (name) exports.add(name);
    }
  }
  return exports;
}

module.exports = {
  LEGACY_CHANNEL_EXPORTS,
  LEGACY_RUNTIME_INSTALLER_ARTIFACT,
  LEGACY_RUNTIME_INSTALLER_DEPENDENCY,
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  REACT_NATIVE_CONVENIENCE_ARTIFACTS,
  REACT_NATIVE_MODERN_ENTRIES,
  REACT_NATIVE_PLUGIN_ARTIFACTS,
  REACT_NATIVE_PORTABLE_ENTRIES,
  getNativeArtifactName,
  getNamedExports,
  getRuntimeSpecifiers,
  getSideEffectImportSpecifiers,
  hasDefaultExport,
  rewriteHasteSpecifiers,
};
