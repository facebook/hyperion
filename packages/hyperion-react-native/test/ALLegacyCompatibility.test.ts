/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import { Channel } from 'hyperion-channel/src/Channel';
import type {
  IJsxRuntimeModuleExports,
  IReactModuleExports,
} from 'hyperion-react/src/IReact';
import { getALRuntimeConfig, resetALRuntimeForTests } from '../src/ALRuntime';
import { setCurrentScreen } from '../src/ALScreen';
import type { ALChannelEventMap } from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => undefined }),
  },
}));

class FakeCallInterceptor {
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
  channel: Channel<ALChannelEventMap>,
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

describe('legacy AutoLogging initialization compatibility', () => {
  afterEach(() => resetALRuntimeForTests());

  it('retains the existing AMA initialization type contract', () => {
    expect(existingAMAConfigCompiles).toBeDefined();
  });

  it('emits legacy function events without enabling modern families', () => {
    const modules = createInterceptedModules();
    const channel = new Channel<ALChannelEventMap>();
    const propEvents: ALChannelEventMap['al_react_component_prop'][0][] = [];
    const mountEvents: ALChannelEventMap['al_react_component_mount'][0][] = [];
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

    AutoLogging.init({
      channel,
      react: {
        ReactModule: React,
        IReactModule: modules.IReactModule,
        IJsxRuntimeModule: modules.IJsxRuntimeModule,
        enableInterceptClassComponentConstructor: false,
        enableInterceptClassComponentMethods: false,
        enableInterceptFunctionComponentRender: true,
        enableInterceptDomElement: false,
        enableInterceptComponentElement: true,
        enableInterceptSpecialElement: false,
        enableReactComponentPublisher: true,
      },
      props: {
        intercept: ['onPress'],
        enableInterceptReactComponentProp: true,
        enableReactComponentPropPublisher: true,
      },
    });

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
    expect(getALRuntimeConfig()).toEqual(
      expect.objectContaining({
        heartbeatInterval: false,
        features: undefined,
      })
    );
  });

  it('keeps interception and publishing controls independent', () => {
    const modules = createInterceptedModules();
    const channel = new Channel<ALChannelEventMap>();
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

  it('honors class and DOM interception flags', () => {
    const modules = createInterceptedModules();
    const channel = new Channel<ALChannelEventMap>();
    const propEvents: ALChannelEventMap['al_react_component_prop'][0][] = [];
    const mountEvents: ALChannelEventMap['al_react_component_mount'][0][] = [];
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
        enableReactComponentPublisher: true,
      },
      componentProps: {
        intercept: ['onPress'],
        enableInterceptReactComponentProp: true,
        enableReactComponentPropPublisher: true,
      },
    });

    modules.jsxDEV.invoke(LegacyClass, {});
    const domArgs = modules.jsxs.invoke('button', {
      onPress: () => undefined,
    });
    (domArgs[1] as { onPress(): void }).onPress();

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

  it('keeps modern initialization on modern event families', () => {
    const channel = new Channel<ALChannelEventMap>();
    const screenEvents: ALChannelEventMap['al_screen_transition_event'][0][] =
      [];
    const legacyEvents: unknown[] = [];
    channel.addListener('al_screen_transition_event', (event) =>
      screenEvents.push(event)
    );
    channel.addListener('al_react_component_prop', (event) =>
      legacyEvents.push(event)
    );

    AutoLogging.init({
      appName: 'modern',
      channel,
      heartbeatInterval: false,
    });
    setCurrentScreen('modern_compatibility');

    expect(screenEvents).toHaveLength(1);
    expect(legacyEvents).toHaveLength(0);
  });
});
