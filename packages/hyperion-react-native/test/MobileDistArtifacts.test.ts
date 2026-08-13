/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import mobileDistUtils from '../../../scripts/mobile-dist-utils.cjs';

const {
  NATIVE_ONLY_ARTIFACTS,
  PORTABLE_NATIVE_ALIASES,
  getRuntimeSpecifiers,
  getNativeArtifactName,
  rewriteHasteSpecifiers,
} = mobileDistUtils as {
  NATIVE_ONLY_ARTIFACTS: readonly string[];
  PORTABLE_NATIVE_ALIASES: readonly string[];
  getRuntimeSpecifiers(code: string): string[];
  getNativeArtifactName(artifact: string): string;
  rewriteHasteSpecifiers(code: string): string;
};

describe('WWW mobile distribution artifacts', () => {
  it('keeps native-dependent entries out of generic filenames', () => {
    expect(NATIVE_ONLY_ARTIFACTS.map(getNativeArtifactName))
      .toMatchInlineSnapshot(`
      [
        "hyperionMobileReactNativeJSXRuntime.react.native.js",
        "hyperionMobileReactNativeJSXDevRuntime.react.native.js",
      ]
    `);
    expect(PORTABLE_NATIVE_ALIASES).toEqual(['hyperionMobileReactNative.js']);
    expect(PORTABLE_NATIVE_ALIASES.map(getNativeArtifactName)).toEqual([
      'hyperionMobileReactNative.react.native.js',
    ]);
  });

  it('snapshots bare Haste import specifiers for every import form', () => {
    const generated = rewriteHasteSpecifiers(`
      import './hyperionMobileSideEffect.js';
      import {observe} from './hyperionMobileObservation.js';
      export {install} from './hyperionMobileInstaller.js';
      const runtime = import('./hyperionMobileRuntime.js');
      const required = require('./hyperionMobileRequired.js');
      import {jsx} from 'react/jsx-runtime';
    `);

    expect(getRuntimeSpecifiers(generated)).toMatchInlineSnapshot(`
      [
        "hyperionMobileSideEffect",
        "hyperionMobileObservation",
        "hyperionMobileInstaller",
        "hyperionMobileRuntime",
        "react/jsx-runtime",
        "hyperionMobileRequired",
      ]
    `);
    expect(generated).not.toContain("'./hyperionMobile");
  });
});
