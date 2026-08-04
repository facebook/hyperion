/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { StrictMode, Suspense } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { jsx } from '../src/jsx-runtime';
import { addChannelSubscriber } from '../src/ALChannel';
import {
  initializeAutoLogging,
  resetALRuntimeForTests,
} from '../src/ALRuntime';
import {
  ALSurface,
  ALSurfaceData,
  useSurface,
  type ALSurfaceDataNode,
} from '../src/ALSurface';
import type { ALSurfaceMutationEventData, ALUIEventData } from '../src/ALTypes';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => undefined }),
  },
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

describe('React Native AutoLogging runtime', () => {
  afterEach(async () => {
    resetALRuntimeForTests();
    await Promise.resolve();
  });

  it('isolates subscribers and preserves application handler behavior', () => {
    const events: ALUIEventData[] = [];
    addChannelSubscriber('al_ui_event', () => {
      throw new Error('subscriber failure');
    });
    addChannelSubscriber('al_ui_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    const receiver = { name: 'receiver' };
    const applicationHandler = jest.fn(function (
      this: unknown,
      value: unknown
    ) {
      expect(this).toBe(receiver);
      expect(value).toEqual({ private: 'argument' });
      return 'application-result';
    });
    function Button(props: { onPress(): unknown; accessibilityLabel: string }) {
      return React.createElement('button', props);
    }

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(Button, {
          onPress: applicationHandler,
          accessibilityLabel: 'Save',
        })
      );
    });
    const installedHandler = renderer!.root.findByType('button').props.onPress;
    const result = installedHandler.call(receiver, { private: 'argument' });

    expect(result).toBe('application-result');
    expect(applicationHandler).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        event: 'click',
        eventIndex: 0,
        elementText: 'Save',
        elementTextSource: 'accessibilityLabel',
        sourceProp: 'onPress',
      })
    );
    expect(JSON.stringify(events[0])).not.toContain('private');
  });

  it('publishes visible button titles with their source', () => {
    const events: ALUIEventData[] = [];
    addChannelSubscriber('al_ui_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    function Button(props: { onPress(): void; testID: string; title: string }) {
      return React.createElement('button', props);
    }
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(Button, {
          onPress: () => undefined,
          testID: 'save-button',
          title: 'Save changes',
        })
      );
    });
    const installedHandler = renderer?.root.findByType('button').props.onPress;
    expect(installedHandler).toBeDefined();
    installedHandler?.();

    expect(events[0]).toEqual(
      expect.objectContaining({
        elementName: 'save-button',
        elementText: 'Save changes',
        elementTextSource: 'title',
        elementTextSourceType: 'application_text',
        elementTextPotentiallySensitive: true,
      })
    );
  });

  it('publishes raw text input with sensitivity provenance', () => {
    const events: ALUIEventData[] = [];
    addChannelSubscriber('al_ui_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    function TextInput(props: {
      onChangeText(value: string): void;
      testID: string;
    }) {
      return React.createElement('input', props);
    }
    const applicationHandler = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(TextInput, {
          onChangeText: applicationHandler,
          testID: 'account-email',
        })
      );
    });

    const installedHandler = renderer?.root.findByType('input').props
      .onChangeText as ((value: string) => void) | undefined;
    expect(installedHandler).toBeDefined();
    installedHandler?.('person@example.com');

    expect(applicationHandler).toHaveBeenCalledWith('person@example.com');
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        value: 'person@example.com',
        valueSource: 'callback_argument',
        valueSourceType: 'user_input',
        valuePotentiallySensitive: true,
      })
    );
  });

  it('preserves thrown application exceptions', () => {
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    const applicationError = new Error('application failure');
    function Button(props: { onPress(): unknown }) {
      return React.createElement('button', props);
    }
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(Button, {
          onPress: () => {
            throw applicationError;
          },
        })
      );
    });
    expect(() => renderer!.root.findByType('button').props.onPress()).toThrow(
      applicationError
    );
  });

  it('keeps the last committed handler snapshot', () => {
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    const first = jest.fn(() => 'first');
    const second = jest.fn(() => 'second');
    function Button(props: { onPress(): unknown }) {
      return React.createElement('button', props);
    }
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(jsx(Button, { onPress: first }));
    });
    const stableHandler = renderer!.root.findByType('button').props.onPress;
    act(() => renderer!.update(jsx(Button, { onPress: second })));
    const updatedHandler = renderer!.root.findByType('button').props.onPress;
    expect(updatedHandler).toBe(stableHandler);
    expect(updatedHandler()).toBe('second');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not accept handler snapshots from suspended renders', async () => {
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    const first = jest.fn(() => 'first');
    const suspended = jest.fn(() => 'suspended');
    const promise = new Promise<void>(() => undefined);
    function Button(props: { onPress(): unknown }) {
      return React.createElement('button', props);
    }
    function MaybeSuspend({ active }: { active: boolean }) {
      if (active) throw promise;
      return null;
    }
    function Tree({
      handler,
      shouldSuspend,
    }: {
      handler(): unknown;
      shouldSuspend: boolean;
    }) {
      return React.createElement(
        Suspense,
        { fallback: null },
        jsx(Button, { onPress: handler }),
        React.createElement(MaybeSuspend, { active: shouldSuspend })
      );
    }

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(Tree, { handler: first, shouldSuspend: false })
      );
    });
    const committedHandler = renderer!.root.findByType('button').props.onPress;
    await act(async () => {
      renderer!.update(
        React.createElement(Tree, {
          handler: suspended,
          shouldSuspend: true,
        })
      );
    });

    expect(committedHandler()).toBe('first');
    expect(suspended).not.toHaveBeenCalled();
  });

  it('keeps wrapper state stable across explicit undefined handler toggles', () => {
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    const first = jest.fn();
    const second = jest.fn();
    function Button(props: { onPress?: () => void }) {
      return React.createElement('button', props);
    }
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(jsx(Button, { onPress: first }));
    });
    const stableHandler = renderer!.root.findByType('button').props.onPress;
    act(() => renderer!.update(jsx(Button, { onPress: undefined })));
    expect(renderer!.root.findByType('button').props.onPress).toBeUndefined();
    act(() => renderer!.update(jsx(Button, { onPress: second })));
    expect(renderer!.root.findByType('button').props.onPress).toBe(
      stableHandler
    );
  });

  it('cleans delayed value events on unmount', () => {
    jest.useFakeTimers();
    const events: ALUIEventData[] = [];
    addChannelSubscriber('al_ui_event', (event) => events.push(event));
    initializeAutoLogging({
      appName: 'test',
      heartbeatInterval: false,
      interceptProps: ['onValueChange'],
    });
    function Slider(props: { onValueChange(value: number): void }) {
      return React.createElement('slider', props);
    }
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(Slider, { onValueChange: () => undefined })
      );
    });
    renderer!.root.findByType('slider').props.onValueChange(2);
    act(() => renderer!.unmount());
    act(() => jest.runAllTimers());
    expect(events).toHaveLength(0);
    jest.useRealTimers();
  });

  it('does zero observation work when disabled', () => {
    const events: ALUIEventData[] = [];
    addChannelSubscriber('al_ui_event', (event) => events.push(event));
    initializeAutoLogging({
      appName: 'test',
      enabled: false,
      heartbeatInterval: false,
    });
    const handler = jest.fn();
    function Button(props: { onPress(): unknown }) {
      return React.createElement('button', props);
    }
    const element = jsx(Button, { onPress: handler });
    expect(element.type).toBe(Button);
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(element);
    });
    renderer!.root.findByType('button').props.onPress();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(0);
  });

  it('registers only committed surfaces with interactive ancestry', async () => {
    const mutations: ALSurfaceMutationEventData[] = [];
    addChannelSubscriber('al_surface_mutation_event', (event) =>
      mutations.push(event)
    );
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    ALSurfaceData.root.setInheritedPropery('fixture_owner', 'root_value');
    let captured: ALSurfaceDataNode | null = null;
    function Probe() {
      captured = useSurface();
      return null;
    }
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(
          StrictMode,
          null,
          React.createElement(
            ALSurface,
            {
              name: 'dashboard',
              metadata: {
                root_marker: 'root',
                numeric_marker: 2,
                nullable_marker: null,
              },
            },
            React.createElement(
              ALSurface,
              {
                name: 'container',
                nonInteractive: true,
                metadata: { private_marker: 'lifecycle_only' },
              },
              React.createElement(
                ALSurface,
                {
                  name: 'actions',
                  metadata: { child_marker: 'child' },
                  uiEventMetadata: { click: { action: 'save' } },
                },
                React.createElement(Probe)
              )
            )
          )
        )
      );
    });
    await act(async () => Promise.resolve());

    expect(captured).not.toBeNull();
    expect(captured!.nonInteractiveSurface).toBe('dashboard/container/actions');
    expect(captured!.surface).toBe('dashboard/actions');
    expect(captured!.metadata).toEqual({
      root_marker: 'root',
      numeric_marker: 2,
      nullable_marker: null,
      private_marker: 'lifecycle_only',
      child_marker: 'child',
    });
    expect(captured!.interactiveMetadata).toEqual({
      root_marker: 'root',
      numeric_marker: 2,
      nullable_marker: null,
      child_marker: 'child',
    });
    expect(captured!.getInheriteUIEventMetadata('click')).toEqual({
      action: 'save',
    });
    expect(ALSurfaceData.get('dashboard/actions')).toBe(captured);
    expect(ALSurfaceData.tryGet('dashboard/container/actions')).toBe(captured);
    expect(captured!.parent.getChild('actions')).toBe(captured);
    expect(captured!.getInheritedPropery('fixture_owner')).toBe('root_value');
    expect(captured!.getElements()).toBe(captured!.getElements());
    expect(Object.isFrozen(captured!.getElements())).toBe(true);
    expect(() => JSON.stringify(captured)).not.toThrow();
    expect(
      mutations.filter((event) => event.event === 'mount_component')
    ).toHaveLength(3);

    act(() => renderer!.unmount());
    await act(async () => Promise.resolve());
    expect(ALSurfaceData.tryGet('dashboard/actions')).toBeUndefined();
    const unmounts = mutations.filter(
      (event) => event.event === 'unmount_component'
    );
    expect(unmounts).toHaveLength(3);
    expect(unmounts.every((event) => event.relatedEventIndex != null)).toBe(
      true
    );
  });
});
