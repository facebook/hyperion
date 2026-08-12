/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import mobileDistUtils from '../../../scripts/mobile-dist-utils.cjs';

const {
  NATIVE_ONLY_ARTIFACTS,
  getImportSpecifiers,
  getNativeArtifactName,
  rewriteHasteSpecifiers,
} = mobileDistUtils as {
  NATIVE_ONLY_ARTIFACTS: readonly string[];
  getImportSpecifiers(code: string): string[];
  getNativeArtifactName(artifact: string): string;
  rewriteHasteSpecifiers(code: string): string;
};

describe('WWW mobile distribution artifacts', () => {
  it('keeps native-dependent entries out of generic filenames', () => {
    expect(NATIVE_ONLY_ARTIFACTS.map(getNativeArtifactName))
      .toMatchInlineSnapshot(`
      [
        "hyperionMobileReactNative.react.native.js",
        "hyperionMobileReactNativeJSXRuntime.react.native.js",
        "hyperionMobileReactNativeJSXDevRuntime.react.native.js",
      ]
    `);
  });

  it('snapshots bare Haste import specifiers for every import form', () => {
    const generated = rewriteHasteSpecifiers(`
      import './hyperionMobileSideEffect.js';
      import {observe} from './hyperionMobileObservation.js';
      export {install} from './hyperionMobileInstaller.js';
      const runtime = import('./hyperionMobileRuntime.js');
      import {jsx} from 'react/jsx-runtime';
    `);

    expect(getImportSpecifiers(generated)).toMatchInlineSnapshot(`
      [
        "hyperionMobileSideEffect",
        "hyperionMobileObservation",
        "hyperionMobileInstaller",
        "hyperionMobileRuntime",
        "react/jsx-runtime",
      ]
    `);
    expect(generated).not.toContain("'./hyperionMobile");
  });
});
