/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel } from 'hyperion-channel/src/Channel';
import type { ALChannelEventMap } from '../src/ALTypes';
import { resetALRuntimeForTests } from '../src/ALRuntime';
import * as AutoLogging from '../src/AutoLogging';
import * as Observation from '../src/ReactNativeElementObservation';

type RuntimeFunction = Observation.JSXRuntimeFunction;

function createRawRuntimes() {
  const render: RuntimeFunction = (type, props, key) => ({ key, props, type });
  return {
    originalCreateElement: render,
    originalJSX: render,
    originalJSXDEV: render,
    reactModule: { createElement: render },
    jsxRuntimeModule: { jsx: render, jsxs: render },
    jsxDevRuntimeModule: { jsxDEV: render },
  };
}

function createChannel(): Channel<ALChannelEventMap> {
  return new Channel<ALChannelEventMap>();
}

function createUnreadableReactOptions() {
  return Object.defineProperties(
    {},
    {
      ReactModule: {
        get(): never {
          throw new Error('ReactModule was accessed');
        },
      },
      JSXRuntimeModule: {
        get(): never {
          throw new Error('JSXRuntimeModule was accessed');
        },
      },
      JSXDevRuntimeModule: {
        get(): never {
          throw new Error('JSXDevRuntimeModule was accessed');
        },
      },
    }
  );
}

describe('AutoLogging JSX runtime installation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetALRuntimeForTests();
  });

  it('installs supplied raw runtimes before enabling observation', () => {
    const runtimes = createRawRuntimes();
    const install = Observation.installReactNativeJSXRuntime;
    const observationStateDuringInstallation: boolean[] = [];
    const installSpy = jest
      .spyOn(Observation, 'installReactNativeJSXRuntime')
      .mockImplementation((...args) => {
        observationStateDuringInstallation.push(
          Observation.isElementObservationEnabled()
        );
        install(...args);
      });

    AutoLogging.init({
      appName: 'atomic_installation',
      channel: createChannel(),
      heartbeatInterval: false,
      react: {
        ReactModule: runtimes.reactModule,
        JSXRuntimeModule: runtimes.jsxRuntimeModule,
        JSXDevRuntimeModule: runtimes.jsxDevRuntimeModule,
      },
    });

    expect(installSpy).toHaveBeenCalledWith(
      runtimes.reactModule,
      runtimes.jsxRuntimeModule,
      runtimes.jsxDevRuntimeModule
    );
    expect(observationStateDuringInstallation).toEqual([false]);
    expect(Observation.isElementObservationEnabled()).toBe(true);
    expect(runtimes.reactModule.createElement).not.toBe(
      runtimes.originalCreateElement
    );
    expect(runtimes.jsxRuntimeModule.jsx).not.toBe(runtimes.originalJSX);
    expect(runtimes.jsxRuntimeModule.jsxs).not.toBe(runtimes.originalJSX);
    expect(runtimes.jsxDevRuntimeModule.jsxDEV).not.toBe(
      runtimes.originalJSXDEV
    );

    function Pressable() {
      return null;
    }
    const observed = runtimes.jsxRuntimeModule.jsx?.(Pressable, {
      onPress: () => undefined,
    }) as { type: unknown };
    expect(observed.type).not.toBe(Pressable);
  });

  it('installs supplied runtimes when Hermes does not provide Reflect', () => {
    const runtimes = createRawRuntimes();
    const runtimeGlobal = globalThis as typeof globalThis & {
      Reflect: typeof Reflect | undefined;
    };
    const originalReflect = runtimeGlobal.Reflect;

    try {
      runtimeGlobal.Reflect = undefined;
      AutoLogging.init({
        appName: 'hermes_without_reflect',
        channel: createChannel(),
        heartbeatInterval: false,
        react: {
          ReactModule: runtimes.reactModule,
          JSXRuntimeModule: runtimes.jsxRuntimeModule,
          JSXDevRuntimeModule: runtimes.jsxDevRuntimeModule,
        },
      });
    } finally {
      runtimeGlobal.Reflect = originalReflect;
    }

    expect(runtimes.reactModule.createElement).not.toBe(
      runtimes.originalCreateElement
    );
    expect(runtimes.jsxRuntimeModule.jsx).not.toBe(runtimes.originalJSX);
    expect(runtimes.jsxRuntimeModule.jsxs).not.toBe(runtimes.originalJSX);
    expect(runtimes.jsxDevRuntimeModule.jsxDEV).not.toBe(
      runtimes.originalJSXDEV
    );
    expect(Observation.getJSXRuntimeBenchmarkPair()).not.toBeNull();
  });

  it.each([
    { enabled: false, features: undefined },
    { enabled: true, features: { automaticUIEvents: false } },
  ])('does not install runtimes when observation is disabled: %p', (config) => {
    const runtimes = createRawRuntimes();
    const installSpy = jest.spyOn(Observation, 'installReactNativeJSXRuntime');

    AutoLogging.init({
      appName: 'disabled_installation',
      channel: createChannel(),
      heartbeatInterval: false,
      ...config,
      react: {
        ReactModule: runtimes.reactModule,
        JSXRuntimeModule: runtimes.jsxRuntimeModule,
        JSXDevRuntimeModule: runtimes.jsxDevRuntimeModule,
      },
    });

    expect(installSpy).not.toHaveBeenCalled();
    expect(runtimes.reactModule.createElement).toBe(
      runtimes.originalCreateElement
    );
    expect(runtimes.jsxRuntimeModule.jsx).toBe(runtimes.originalJSX);
    expect(runtimes.jsxDevRuntimeModule.jsxDEV).toBe(runtimes.originalJSXDEV);
    expect(Observation.isElementObservationEnabled()).toBe(false);
  });

  it.each([
    { enabled: false, features: undefined },
    { enabled: true, features: { automaticUIEvents: false } },
  ])(
    'does not inspect raw runtimes when observation is disabled: %p',
    (config) => {
      expect(() =>
        AutoLogging.init({
          appName: 'unreadable_disabled_runtimes',
          channel: createChannel(),
          heartbeatInterval: false,
          ...config,
          react: createUnreadableReactOptions(),
        })
      ).not.toThrow();
    }
  );

  it('does not call the installer when no raw runtimes are supplied', () => {
    const installSpy = jest.spyOn(Observation, 'installReactNativeJSXRuntime');

    AutoLogging.init({
      appName: 'package_entries_only',
      channel: createChannel(),
      heartbeatInterval: false,
    });

    expect(installSpy).not.toHaveBeenCalled();
    expect(Observation.isElementObservationEnabled()).toBe(true);
  });

  it('keeps first-call ownership and does not install later runtimes', () => {
    const first = createRawRuntimes();
    const second = createRawRuntimes();
    AutoLogging.init({
      appName: 'first',
      channel: createChannel(),
      heartbeatInterval: false,
      react: {
        ReactModule: first.reactModule,
        JSXRuntimeModule: first.jsxRuntimeModule,
        JSXDevRuntimeModule: first.jsxDevRuntimeModule,
      },
    });

    AutoLogging.init({
      appName: 'second',
      channel: createChannel(),
      heartbeatInterval: false,
      react: {
        ReactModule: second.reactModule,
        JSXRuntimeModule: second.jsxRuntimeModule,
        JSXDevRuntimeModule: second.jsxDevRuntimeModule,
      },
    });

    expect(first.jsxRuntimeModule.jsx).not.toBe(first.originalJSX);
    expect(second.reactModule.createElement).toBe(second.originalCreateElement);
    expect(second.jsxRuntimeModule.jsx).toBe(second.originalJSX);
    expect(second.jsxDevRuntimeModule.jsxDEV).toBe(second.originalJSXDEV);
  });

  it('keeps the explicit legacy installer idempotent with init', () => {
    const runtimes = createRawRuntimes();
    Observation.installReactNativeJSXRuntime(
      runtimes.reactModule,
      runtimes.jsxRuntimeModule,
      runtimes.jsxDevRuntimeModule
    );
    const installedCreateElement = runtimes.reactModule.createElement;
    const installedJSX = runtimes.jsxRuntimeModule.jsx;
    const installedJSXDEV = runtimes.jsxDevRuntimeModule.jsxDEV;

    AutoLogging.init({
      appName: 'preinstalled',
      channel: createChannel(),
      heartbeatInterval: false,
      react: {
        ReactModule: runtimes.reactModule,
        JSXRuntimeModule: runtimes.jsxRuntimeModule,
        JSXDevRuntimeModule: runtimes.jsxDevRuntimeModule,
      },
    });

    expect(runtimes.reactModule.createElement).toBe(installedCreateElement);
    expect(runtimes.jsxRuntimeModule.jsx).toBe(installedJSX);
    expect(runtimes.jsxDevRuntimeModule.jsxDEV).toBe(installedJSXDEV);
  });

  it('leaves immutable runtime namespaces unchanged without failing init', () => {
    const runtimes = createRawRuntimes();
    const reactModule = Object.freeze({
      createElement: runtimes.originalCreateElement,
    });
    const jsxRuntimeModule = Object.freeze({
      jsx: runtimes.originalJSX,
      jsxs: runtimes.originalJSX,
    });
    const jsxDevRuntimeModule = Object.freeze({
      jsxDEV: runtimes.originalJSXDEV,
    });

    expect(() =>
      AutoLogging.init({
        appName: 'immutable_runtimes',
        channel: createChannel(),
        heartbeatInterval: false,
        react: {
          ReactModule: reactModule,
          JSXRuntimeModule: jsxRuntimeModule,
          JSXDevRuntimeModule: jsxDevRuntimeModule,
        },
      })
    ).not.toThrow();

    expect(reactModule.createElement).toBe(runtimes.originalCreateElement);
    expect(jsxRuntimeModule.jsx).toBe(runtimes.originalJSX);
    expect(jsxRuntimeModule.jsxs).toBe(runtimes.originalJSX);
    expect(jsxDevRuntimeModule.jsxDEV).toBe(runtimes.originalJSXDEV);
    expect(Observation.isElementObservationEnabled()).toBe(true);
  });

  it('keeps writable exports installed when a sibling cannot be replaced', () => {
    const runtimes = createRawRuntimes();
    const jsxRuntimeModule = {
      jsx: runtimes.originalJSX,
      jsxs: runtimes.originalJSX,
    };
    Object.defineProperty(jsxRuntimeModule, 'jsxs', {
      configurable: false,
      enumerable: true,
      value: runtimes.originalJSX,
      writable: false,
    });

    Observation.installReactNativeJSXRuntime({}, jsxRuntimeModule);

    expect(jsxRuntimeModule.jsx).not.toBe(runtimes.originalJSX);
    expect(jsxRuntimeModule.jsxs).toBe(runtimes.originalJSX);
  });

  it('does not retroactively instrument elements created before init', () => {
    const runtimes = createRawRuntimes();
    function Pressable() {
      return null;
    }
    const props = { onPress: () => undefined };
    const createdBeforeInit = runtimes.jsxRuntimeModule.jsx?.(
      Pressable,
      props
    ) as { type: unknown };

    AutoLogging.init({
      appName: 'late_initialization',
      channel: createChannel(),
      heartbeatInterval: false,
      react: {
        ReactModule: runtimes.reactModule,
        JSXRuntimeModule: runtimes.jsxRuntimeModule,
        JSXDevRuntimeModule: runtimes.jsxDevRuntimeModule,
      },
    });

    const createdAfterInit = runtimes.jsxRuntimeModule.jsx?.(
      Pressable,
      props
    ) as { type: unknown };
    expect(createdBeforeInit.type).toBe(Pressable);
    expect(createdAfterInit.type).not.toBe(Pressable);
  });
});
