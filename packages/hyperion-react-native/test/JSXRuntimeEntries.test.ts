/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import type React from 'react';
import {
  resetElementObservationForTests,
  setElementInstrumenter,
  setElementObservationEnabled,
  type JSXRuntimeFunction,
} from '../src/ReactNativeElementObservation';
import { jsxDEV } from '../src/jsx-dev-runtime';
import { jsx, jsxs } from '../src/jsx-runtime';

describe('React Native JSX runtime package entries', () => {
  afterEach(() => resetElementObservationForTests());

  test.each([
    ['jsx', jsx as JSXRuntimeFunction, { children: 'content' }, []],
    ['jsxs', jsxs as JSXRuntimeFunction, { children: [] }, []],
    [
      'jsxDEV',
      jsxDEV as JSXRuntimeFunction,
      { children: 'content' },
      [false, undefined, undefined],
    ],
  ] as const)(
    '%s delegates to React while applying observation',
    (_name, render, props, trailingArguments) => {
      function Original() {
        return null;
      }
      function Wrapper() {
        return null;
      }
      setElementInstrumenter(() => ({ type: Wrapper }));

      const unobservedProps = { ...props };
      const unobserved = render(
        Original,
        unobservedProps,
        'key',
        ...trailingArguments
      ) as React.ReactElement;
      expect(unobserved.type).toBe(Original);
      expect(unobserved.key).toBe('key');

      setElementObservationEnabled(true);
      const observedProps = { ...props };
      const observed = render(
        Original,
        observedProps,
        'key',
        ...trailingArguments
      ) as React.ReactElement;
      expect(observed.type).toBe(Wrapper);
      expect(observed.key).toBe('key');
      expect(observed.props).toEqual(props);
    }
  );
});
