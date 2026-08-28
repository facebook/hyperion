/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import React from 'react';
import { Channel } from '../src/channel';
import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type {
  IJsxRuntimeModuleExports,
  IReactModuleExports,
} from 'hyperion-react/src/IReact';
import type { LegacyCallInterceptor } from '../src/ALLegacyAutoLogging';
import { setCurrentScreen } from '../src/ALScreen';
import type {
  ALChannelEventMap,
  ALLegacyChannelEventMap,
  ALLegacyReactComponentMountEventData,
  ALLegacyReactComponentPropEventData,
  ALModernChannelEventMap,
  ALReactNativeEventMap,
  ALScreenTransitionEventData,
} from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';
import { resetElementObservationForTests } from '../src/ReactNativeElementObservation';

class FakeCallInterceptor implements LegacyCallInterceptor {
  private readonly mappers: ((args: unknown[]) => unknown[])[] = [];

  onBeforeCallMapperAdd(mapper: (args: unknown[]) => unknown[]): unknown {
    this.mappers.push(mapper);
    return mapper;
  }

  invoke(...input: unknown[]): unknown[] {
    let args = input;
    for (const mapper of this.mappers) args = mapper(args);
    return args;
  }
}

function createInterceptedModules() {
  const createElement = new FakeCallInterceptor();
  const jsx = new FakeCallInterceptor();
  const jsxs = new FakeCallInterceptor();
  const jsxDEV = new FakeCallInterceptor();
  return {
    createElement,
    jsx,
    jsxs,
    jsxDEV,
    IReactModule: { createElement },
    IJsxRuntimeModule: { jsx, jsxs, jsxDEV },
  };
}

function existingAMAConfigCompiles(
  channel: Channel<ALReactNativeEventMap>,
  IReactModule: IReactModuleExports,
  IJsxRuntimeModule: IJsxRuntimeModuleExports
): AutoLogging.InitOptions {
  return {
    channel,
    react: {
      ReactModule: React,
      IReactModule,
      IJsxRuntimeModule,
      enableInterceptClassComponentConstructor: true,
      enableInterceptClassComponentMethods: true,
      enableInterceptFunctionComponentRender: true,
      enableInterceptDomElement: true,
      enableInterceptComponentElement: true,
      enableInterceptSpecialElement: true,
      enableReactComponentPublisher: true,
    },
    props: {
      intercept: ['onPress'],
      enableInterceptReactComponentProp: true,
      enableReactComponentPropPublisher: true,
    },
  };
}

function legacyTypeAliasesCompile(
  _all: ALChannelEventMap,
  _modern: ALModernChannelEventMap,
  _legacy: ALLegacyChannelEventMap,
  _event: AutoLogging.ALChannelEvent,
  _react: AutoLogging.ReactOptions
): readonly unknown[] {
  return [_all, _modern, _legacy, _event, _react];
}

describe('legacy React Native AutoLogging compatibility', () => {
  afterEach(() => {
    AutoLogging.dispose();
    resetElementObservationForTests();
    jest.useRealTimers();
  });

  test('retains the existing injected-module initialization fields', () => {
    expect(existingAMAConfigCompiles).toBeDefined();
    expect(legacyTypeAliasesCompile).toBeDefined();
  });

  test('emits legacy prop and mount events without modern families', () => {
    jest.useFakeTimers();
    const modules = createInterceptedModules();
    const channel = new Channel<ALReactNativeEventMap>();
    const propEvents: ALLegacyReactComponentPropEventData[] = [];
    const mountEvents: ALLegacyReactComponentMountEventData[] = [];
    const modernEvents: unknown[] = [];
    channel.addListener('al_react_component_prop', (event) =>
      propEvents.push(event)
    );
    channel.addListener('al_react_component_mount', (event) =>
      mountEvents.push(event)
    );
    channel.addListener('al_ui_event', (event) => modernEvents.push(event));
    channel.addListener('al_heartbeat_event', (event) =>
      modernEvents.push(event)
    );
    const receiver = { id: 'receiver' };
    const applicationHandler = jest.fn(function (this: unknown, value: string) {
      expect(this).toBe(receiver);
      return `handled:${value}`;
    });
    function Pressable() {
      return null;
    }
    const originalProps = { onPress: applicationHandler };

    AutoLogging.init(
      existingAMAConfigCompiles(
        channel,
        modules.IReactModule as IReactModuleExports,
        modules.IJsxRuntimeModule as IJsxRuntimeModuleExports
      )
    );
    const args = modules.jsx.invoke(Pressable, originalProps, 'key');
    const installedProps = args[1] as { onPress(value: string): string };

    expect(args[0]).toBe(Pressable);
    expect(installedProps).not.toBe(originalProps);
    expect(originalProps.onPress).toBe(applicationHandler);
    expect(installedProps.onPress.call(receiver, 'raw-value')).toBe(
      'handled:raw-value'
    );
    expect(propEvents).toEqual([
      {
        component: 'Pressable',
        prop: 'onPress',
        args: ['raw-value'],
        type: 'func',
      },
    ]);
    expect(mountEvents).toEqual([
      { surface: 'Pressable', args: [originalProps] },
    ]);
    expect(modernEvents).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('keeps interception and publishing controls independent', () => {
    const modules = createInterceptedModules();
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const propEvents: unknown[] = [];
    const mountEvents: unknown[] = [];
    channel.addListener('al_react_component_prop', (event) =>
      propEvents.push(event)
    );
    channel.addListener('al_react_component_mount', (event) =>
      mountEvents.push(event)
    );
    const handler = jest.fn(() => 'result');
    function Pressable() {
      return null;
    }

    AutoLogging.init({
      channel,
      react: {
        ReactModule: React,
        IReactModule: modules.IReactModule,
        IJsxRuntimeModule: modules.IJsxRuntimeModule,
        enableInterceptComponentElement: true,
        enableInterceptFunctionComponentRender: false,
        enableReactComponentPublisher: true,
      },
      props: {
        intercept: ['onPress'],
        enableInterceptReactComponentProp: true,
        enableReactComponentPropPublisher: false,
      },
    });

    const args = modules.createElement.invoke(Pressable, { onPress: handler });
    const installed = (args[1] as { onPress(): string }).onPress;
    expect(installed).not.toBe(handler);
    expect(installed()).toBe('result');
    expect(propEvents).toHaveLength(0);
    expect(mountEvents).toHaveLength(0);
  });

  test('honors class, function, special, and host interception flags', () => {
    const modules = createInterceptedModules();
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const propEvents: ALLegacyReactComponentPropEventData[] = [];
    const mountEvents: ALLegacyReactComponentMountEventData[] = [];
    channel.addListener('al_react_component_prop', (event) =>
      propEvents.push(event)
    );
    channel.addListener('al_react_component_mount', (event) =>
      mountEvents.push(event)
    );
    class LegacyClass extends React.Component {
      render() {
        return null;
      }
    }

    AutoLogging.init({
      channel,
      react: {
        ReactModule: React,
        IReactModule: modules.IReactModule,
        IJsxRuntimeModule: modules.IJsxRuntimeModule,
        enableInterceptClassComponentMethods: true,
        enableInterceptDomElement: true,
        enableInterceptSpecialElement: true,
        enableReactComponentPublisher: true,
      },
      componentProps: {
        intercept: ['onPress'],
        enableInterceptReactComponentProp: true,
        enableReactComponentPropPublisher: true,
      },
    });

    modules.jsxDEV.invoke(LegacyClass, {});
    const hostArgs = modules.jsxs.invoke('button', {
      onPress: () => undefined,
    });
    (hostArgs[1] as { onPress(): void }).onPress();

    expect(mountEvents).toEqual([{ surface: 'LegacyClass', args: [] }]);
    expect(propEvents).toEqual([
      {
        component: 'button',
        prop: 'onPress',
        args: [],
        type: 'dom',
      },
    ]);
  });

  test('does not inspect AppState or enable modern defaults in legacy mode', () => {
    jest.useFakeTimers();
    const modules = createInterceptedModules();
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const reactNativeModule = Object.defineProperty({}, 'AppState', {
      get(): never {
        throw new Error('AppState was accessed');
      },
    });

    expect(() =>
      AutoLogging.init({
        channel,
        react: {
          IJsxRuntimeModule: modules.IJsxRuntimeModule,
          ReactNativeModule: reactNativeModule as never,
          enableInterceptFunctionComponentRender: true,
        },
      })
    ).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
    expect(setCurrentScreen('legacy-screen')).toBe(true);
  });

  test('translates modern compatibility configuration into plugins', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const screens: ALScreenTransitionEventData[] = [];
    channel.addListener('al_screen_transition_event', (event) =>
      screens.push(event)
    );
    AutoLogging.init({
      channel,
      appName: 'modern',
      heartbeatInterval: false,
    });

    expect(setCurrentScreen('modern-compatibility')).toBe(true);
    expect(screens).toHaveLength(1);
  });

  test('keeps installed interceptors reusable after cleanup', () => {
    const modules = createInterceptedModules();
    const firstChannel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const secondChannel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const firstEvents: ALLegacyReactComponentPropEventData[] = [];
    const secondEvents: ALLegacyReactComponentPropEventData[] = [];
    firstChannel.addListener('al_react_component_prop', (event) =>
      firstEvents.push(event)
    );
    secondChannel.addListener('al_react_component_prop', (event) =>
      secondEvents.push(event)
    );
    const options = {
      react: {
        IJsxRuntimeModule: modules.IJsxRuntimeModule,
        enableInterceptFunctionComponentRender: true,
      },
      props: {
        intercept: ['onPress'],
        enableInterceptReactComponentProp: true,
        enableReactComponentPropPublisher: true,
      },
    };
    function Pressable() {
      return null;
    }

    AutoLogging.init({ channel: firstChannel, ...options });
    const first = modules.jsx.invoke(Pressable, {
      onPress: () => undefined,
    });
    (first[1] as { onPress(): void }).onPress();
    AutoLogging.dispose();

    AutoLogging.init({ channel: secondChannel, ...options });
    const second = modules.jsx.invoke(Pressable, {
      onPress: () => undefined,
    });
    (second[1] as { onPress(): void }).onPress();

    expect(firstEvents).toHaveLength(1);
    expect(secondEvents).toHaveLength(1);
  });

  test('does not route disposed module interceptors into a later runtime', () => {
    const firstModules = createInterceptedModules();
    const secondModules = createInterceptedModules();
    const firstChannel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const secondChannel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const firstEvents: ALLegacyReactComponentPropEventData[] = [];
    const secondEvents: ALLegacyReactComponentPropEventData[] = [];
    firstChannel.addListener('al_react_component_prop', (event) =>
      firstEvents.push(event)
    );
    secondChannel.addListener('al_react_component_prop', (event) =>
      secondEvents.push(event)
    );
    const legacyOptions = {
      react: {
        enableInterceptFunctionComponentRender: true,
      },
      props: {
        intercept: ['onPress'],
        enableInterceptReactComponentProp: true,
        enableReactComponentPropPublisher: true,
      },
    };
    function Pressable() {
      return null;
    }

    AutoLogging.init({
      channel: firstChannel,
      ...legacyOptions,
      react: {
        ...legacyOptions.react,
        IJsxRuntimeModule: firstModules.IJsxRuntimeModule,
      },
    });
    const first = firstModules.jsx.invoke(Pressable, {
      onPress: () => undefined,
    });
    AutoLogging.dispose();

    AutoLogging.init({
      channel: secondChannel,
      ...legacyOptions,
      react: {
        ...legacyOptions.react,
        IJsxRuntimeModule: secondModules.IJsxRuntimeModule,
      },
    });
    const second = secondModules.jsx.invoke(Pressable, {
      onPress: () => undefined,
    });
    (first[1] as { onPress(): void }).onPress();
    (second[1] as { onPress(): void }).onPress();

    expect(firstEvents).toHaveLength(0);
    expect(secondEvents).toHaveLength(1);
  });
});
