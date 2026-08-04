/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import { jsx, jsxs } from '../src/jsx-runtime';
import { jsxDEV } from '../src/jsx-dev-runtime';
import { installReactNativeJSXRuntime } from '../src/legacy-runtime-installer';
import {
  setElementInstrumenter,
  setElementObservationEnabled,
} from '../src/ReactNativeElementObservation';

describe('supported JSX runtime entries', () => {
  afterEach(() => {
    setElementObservationEnabled(false);
    setElementInstrumenter(null);
  });

  it.each([jsx, jsxs, jsxDEV])(
    'preserves component identity and key while disabled',
    (runtime) => {
      const Component = () => null;
      const ref = React.createRef<unknown>();
      const props = { value: 1, ref };
      const element = runtime(Component, props, 'stable-key');

      expect(element.type).toBe(Component);
      expect(element.key).toBe('stable-key');
      expect(element.props.value).toBe(1);
      expect(element.props.ref).toBe(ref);
    }
  );

  it('uses an outer element only for an accepted instrumenter', () => {
    const Component = () => null;
    const Wrapper = () => null;
    const props = { onPress: () => undefined };
    setElementInstrumenter(() => ({ type: Wrapper, props: { marker: true } }));
    setElementObservationEnabled(true);

    const element = jsx(Component, props, 'stable-key');
    expect(element.type).toBe(Wrapper);
    expect(element.key).toBe('stable-key');
    expect(element.props).toEqual(
      expect.objectContaining({
        marker: true,
        originalType: Component,
        originalProps: props,
      })
    );
  });

  it('keeps memo and forwardRef objects as the original component type', () => {
    const Forwarded = React.forwardRef(() => null);
    const Memoized = React.memo(Forwarded);
    const Wrapper = () => null;
    setElementInstrumenter(() => ({ type: Wrapper, props: {} }));
    setElementObservationEnabled(true);

    const element = jsx(Memoized, { onPress: () => undefined });
    expect(element.props.originalType).toBe(Memoized);
    expect(Memoized.type).toBe(Forwarded);
  });

  it('shares observer state with the legacy runtime installer', () => {
    const Component = () => null;
    const Wrapper = () => null;
    const render = (type: unknown, props: unknown, key?: unknown) => ({
      key,
      props,
      type,
    });
    const reactModule = { createElement: render };
    const jsxRuntimeModule = { jsx: render, jsxs: render };
    const jsxDevRuntimeModule = { jsxDEV: render };
    setElementInstrumenter(() => ({ type: Wrapper, props: {} }));
    setElementObservationEnabled(true);

    installReactNativeJSXRuntime(
      reactModule,
      jsxRuntimeModule,
      jsxDevRuntimeModule
    );
    const installedJSX = jsxRuntimeModule.jsx;
    installReactNativeJSXRuntime(
      reactModule,
      jsxRuntimeModule,
      jsxDevRuntimeModule
    );

    expect(jsxRuntimeModule.jsx).toBe(installedJSX);
    expect(jsxRuntimeModule.jsx(Component, {}).type).toBe(Wrapper);
    expect(jsxDevRuntimeModule.jsxDEV(Component, {}).type).toBe(Wrapper);
    expect(reactModule.createElement(Component, {}).type).toBe(Wrapper);
    expect(jsx(Component, {}).type).toBe(Wrapper);
  });
});
