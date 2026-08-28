/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import {
  createObservedJSXFunction,
  getOriginalCreateElement,
  installReactNativeJSXRuntime,
  resetElementObservationForTests,
  setElementInstrumenter,
  setElementObservationEnabled,
  type JSXRuntimeFunction,
} from '../src/ReactNativeElementObservation';

function createRenderer() {
  return function renderer(
    this: unknown,
    type: unknown,
    props: unknown,
    ...rest: unknown[]
  ) {
    return { receiver: this, type, props, rest };
  };
}

describe('React Native JSX observation', () => {
  afterEach(() => resetElementObservationForTests());

  test('delegates without observation and preserves runtime semantics', () => {
    const receiver = { name: 'runtime' };
    const original = jest.fn(createRenderer());
    const wrapped = createObservedJSXFunction(original);
    const props = { children: 'content' };

    expect(wrapped.call(receiver, 'View', props, 'key', 'extra')).toEqual({
      receiver,
      type: 'View',
      props,
      rest: ['key', 'extra'],
    });
    expect(original).toHaveBeenCalledTimes(1);

    const error = new Error('application failure');
    const throwing = createObservedJSXFunction(() => {
      throw error;
    });
    expect(() => throwing('View', null)).toThrow(error);
  });

  test('substitutes only the type and preserves fixed JSX arguments', () => {
    const receiver = { name: 'runtime' };
    const original = createRenderer();
    const wrapped = createObservedJSXFunction(original);
    const Wrapper = () => null;
    const props = { children: 'content' };
    const instrumenter = jest.fn(() => ({ type: Wrapper }));
    setElementInstrumenter(instrumenter);
    setElementObservationEnabled(true);

    expect(wrapped.call(receiver, 'Pressable', props, 'key', true)).toEqual({
      receiver,
      type: Wrapper,
      props,
      rest: ['key', true],
    });
    expect(instrumenter).toHaveBeenCalledWith('Pressable', props, 'key');
  });

  test('keeps the original element when observation fails', () => {
    const original = createRenderer();
    const wrapped = createObservedJSXFunction(original);
    setElementInstrumenter(() => {
      throw new Error('observer failure');
    });
    setElementObservationEnabled(true);

    expect(wrapped('View', null)).toEqual({
      receiver: undefined,
      type: 'View',
      props: null,
      rest: [],
    });
  });

  test('does not swallow or retry original renderer failures', () => {
    const error = new Error('renderer failure');
    const original = jest.fn(() => {
      throw error;
    });
    const wrapped = createObservedJSXFunction(original);
    setElementInstrumenter(() => ({ type: 'Observed' }));
    setElementObservationEnabled(true);

    expect(() => wrapped('Original', null)).toThrow(error);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith('Observed', null);
  });

  test('installs jsx, jsxs, jsxDEV, and createElement without Reflect', () => {
    const runtimeGlobal = globalThis as typeof globalThis & {
      Reflect: typeof Reflect | undefined;
    };
    const originalReflect = runtimeGlobal.Reflect;
    const createElement = createRenderer();
    const jsx = createRenderer();
    const jsxs = createRenderer();
    const jsxDEV = createRenderer();
    const reactModule = { createElement };
    const jsxRuntimeModule = { jsx, jsxs };
    const jsxDevRuntimeModule = { jsxDEV };

    try {
      runtimeGlobal.Reflect = undefined;
      installReactNativeJSXRuntime(
        reactModule,
        jsxRuntimeModule,
        jsxDevRuntimeModule
      );
    } finally {
      runtimeGlobal.Reflect = originalReflect;
    }

    expect(reactModule.createElement).not.toBe(createElement);
    expect(jsxRuntimeModule.jsx).not.toBe(jsx);
    expect(jsxRuntimeModule.jsxs).not.toBe(jsxs);
    expect(jsxDevRuntimeModule.jsxDEV).not.toBe(jsxDEV);
    expect(getOriginalCreateElement()).toEqual({
      receiver: reactModule,
      renderer: createElement,
    });
  });

  test('installs writable siblings independently and stays idempotent', () => {
    const jsx = createRenderer();
    const jsxs = createRenderer();
    const runtime: {
      jsx: JSXRuntimeFunction;
      readonly jsxs: JSXRuntimeFunction;
    } = {
      jsx,
      jsxs,
    };
    Object.defineProperty(runtime, 'jsxs', {
      configurable: false,
      enumerable: true,
      value: jsxs,
      writable: false,
    });

    installReactNativeJSXRuntime({}, runtime);
    const installed = runtime.jsx;
    expect(installed).not.toBe(jsx);
    expect(runtime.jsxs).toBe(jsxs);

    installReactNativeJSXRuntime({}, runtime);
    expect(runtime.jsx).toBe(installed);
  });

  test('does not throw for unreadable or immutable facades', () => {
    const original = createRenderer();
    const unreadable = Object.defineProperty({}, 'jsx', {
      get(): never {
        throw new Error('unreadable');
      },
    });
    const immutable = Object.freeze({ jsxDEV: original });

    expect(() => installReactNativeJSXRuntime({}, unreadable)).not.toThrow();
    expect(() =>
      installReactNativeJSXRuntime({}, null, immutable)
    ).not.toThrow();
    expect(immutable.jsxDEV).toBe(original);
  });
});
