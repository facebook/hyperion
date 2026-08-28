/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import mobileDistUtils from '../../../scripts/mobile-dist-utils.cjs';

const {
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  getNativeArtifactName,
  getRuntimeSpecifiers,
  getSideEffectImportSpecifiers,
  rewriteHasteSpecifiers,
} = mobileDistUtils as {
  NATIVE_ONLY_ARTIFACTS: readonly string[];
  PORTABLE_NATIVE_ALIASES: readonly string[];
  getNativeArtifactName(artifact: string): string;
  getRuntimeSpecifiers(code: string): string[];
  getSideEffectImportSpecifiers(code: string): string[];
  rewriteHasteSpecifiers(code: string): string;
};

describe('React Native distribution helpers', () => {
  test('keeps native runtime entries out of generic filenames', () => {
    expect(NATIVE_ONLY_ARTIFACTS.map(getNativeArtifactName)).toEqual([
      'hyperionMobileReactNativeJSXRuntime.react.native.js',
      'hyperionMobileReactNativeJSXDevRuntime.react.native.js',
    ]);
    expect(PORTABLE_NATIVE_ALIASES).toEqual(['hyperionMobileReactNative.js']);
  });

  test('rewrites generated relative imports to bare Haste names', () => {
    const generated = rewriteHasteSpecifiers(`
      import './hyperionMobileSideEffect.js';
      import {observe} from './hyperionMobileObservation.js';
      export {install} from './hyperionMobileInstaller.js';
      const runtime = import('./hyperionMobileRuntime.js');
      const required = require('./hyperionMobileRequired.js');
      import {jsx} from 'react/jsx-runtime';
    `);

    expect(getRuntimeSpecifiers(generated)).toEqual([
      'hyperionMobileSideEffect',
      'hyperionMobileObservation',
      'hyperionMobileInstaller',
      'hyperionMobileRuntime',
      'react/jsx-runtime',
      'hyperionMobileRequired',
    ]);
    expect(generated).not.toContain("'./hyperionMobile");
  });

  test('detects side-effect-only imports rejected by WWW', () => {
    expect(
      getSideEffectImportSpecifiers(`
        import 'react';
        import "hyperionMobileGuid";
        import {guid} from 'hyperionMobileGuid';
        export {mergeMetadata} from 'hyperionMobileReactNativeMetadata';
        const runtime = import('hyperionMobileReactNativeRuntime');
      `)
    ).toEqual(['react', 'hyperionMobileGuid']);
  });
});
