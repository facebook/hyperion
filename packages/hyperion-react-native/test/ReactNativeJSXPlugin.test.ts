/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import * as AutoLogging from '../src/AutoLogging';
import {
  isElementInstrumenterInstalled,
  isElementObservationEnabled,
  resetElementObservationForTests,
  type JSXRuntimeFunction,
} from '../src/ReactNativeElementObservation';
import { createReactNativeJSXPlugin } from '../src/ReactNativeJSXPlugin';
import type { ALReactNativeEventMap } from '../src/ALTypes';

describe('React Native JSX observation plugin', () => {
  afterEach(() => {
    AutoLogging.dispose();
    resetElementObservationForTests();
  });

  test('installs runtimes before starting observation', () => {
    const render: JSXRuntimeFunction = (type, props, key) => ({
      type,
      props,
      key,
    });
    const react = { createElement: render };
    const jsxRuntime = { jsx: render, jsxs: render };
    const jsxDevRuntime = { jsxDEV: render };
    const Wrapper = () => null;
    const installationState: boolean[] = [];
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();

    expect(
      AutoLogging.init({
        channel,
        plugins: [
          createReactNativeJSXPlugin(
            {
              ReactModule: react,
              JSXRuntimeModule: jsxRuntime,
              JSXDevRuntimeModule: jsxDevRuntime,
            },
            () => ({ type: Wrapper })
          ),
          {
            name: 'installation-probe',
            install() {
              installationState.push(isElementObservationEnabled());
            },
          },
        ],
      })
    ).toBe(true);

    expect(installationState).toEqual([false]);
    expect(isElementObservationEnabled()).toBe(true);
    expect(isElementInstrumenterInstalled()).toBe(true);
    expect(
      (jsxRuntime.jsx('Pressable', {}, 'key') as { type: unknown }).type
    ).toBe(Wrapper);

    expect(AutoLogging.dispose()).toBe(true);
    expect(isElementObservationEnabled()).toBe(false);
    expect(isElementInstrumenterInstalled()).toBe(false);
  });

  test('does no JSX setup when the plugin is absent', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    expect(AutoLogging.init({ channel, plugins: [] })).toBe(true);
    expect(isElementObservationEnabled()).toBe(false);
    expect(isElementInstrumenterInstalled()).toBe(false);
  });
});
