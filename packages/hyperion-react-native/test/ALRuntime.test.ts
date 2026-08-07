/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React, { StrictMode, Suspense } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { jsx, jsxs } from '../src/jsx-runtime';
import { jsxDEV } from '../src/jsx-dev-runtime';
import { installReactNativeJSXRuntime } from '../src/legacy-runtime-installer';
import { createObservedJSXFunction } from '../src/ReactNativeElementObservation';
import { logAppEvent } from '../src/ALAppEvent';
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
import type {
  ALCustomEventData,
  ALSurfaceMutationEventData,
  ALUIEventData,
} from '../src/ALTypes';

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
    jest.restoreAllMocks();
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
      placeholder: string;
    }) {
      return React.createElement('input', props);
    }
    const applicationHandler = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(TextInput, {
          onChangeText: applicationHandler,
          placeholder: 'Account email',
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
        elementText: 'Account email',
        elementTextSource: 'placeholder',
        elementTextSourceType: 'application_text',
        elementTextPotentiallySensitive: true,
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

  it('disables automatic UI observation independently of custom events', () => {
    const uiEvents: ALUIEventData[] = [];
    const customEvents: ALCustomEventData[] = [];
    addChannelSubscriber('al_ui_event', (event) => uiEvents.push(event));
    addChannelSubscriber('al_custom_event', (event) => customEvents.push(event));
    initializeAutoLogging({
      appName: 'test',
      heartbeatInterval: false,
      features: { automaticUIEvents: false, customEvents: true },
    });
    const handler = jest.fn();
    function Button(props: { onPress(): unknown }) {
      return React.createElement('button', props);
    }

    const element = jsx(Button, { onPress: handler });
    expect(element.type).toBe(Button);
    logAppEvent('fixture.feature_gate');

    expect(uiEvents).toHaveLength(0);
    expect(customEvents).toHaveLength(1);
  });

  it('disables custom events independently of automatic UI observation', () => {
    const uiEvents: ALUIEventData[] = [];
    const customEvents: ALCustomEventData[] = [];
    addChannelSubscriber('al_ui_event', (event) => uiEvents.push(event));
    addChannelSubscriber('al_custom_event', (event) => customEvents.push(event));
    initializeAutoLogging({
      appName: 'test',
      heartbeatInterval: false,
      features: { automaticUIEvents: true, customEvents: false },
    });
    function Button(props: { onPress(): unknown }) {
      return React.createElement('button', props);
    }
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(Button, { onPress: () => undefined })
      );
    });

    renderer!.root.findByType('button').props.onPress();
    logAppEvent('fixture.feature_gate');

    expect(uiEvents).toHaveLength(1);
    expect(customEvents).toHaveLength(0);
  });

  it('disables surface lifecycle events without disabling the registry', () => {
    const events: ALSurfaceMutationEventData[] = [];
    addChannelSubscriber('al_surface_mutation_event', (event) =>
      events.push(event)
    );
    initializeAutoLogging({
      appName: 'test',
      heartbeatInterval: false,
      features: { surfaceMutationEvents: false },
    });
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(ALSurface, { name: 'registry_only' }, 'content')
      );
    });

    expect(ALSurfaceData.tryGet('registry_only')?.surfaceName).toBe(
      'registry_only'
    );
    expect(events).toHaveLength(0);
    act(() => renderer!.unmount());
    expect(events).toHaveLength(0);
  });

  it.each([
    ['jsx', false],
    ['jsx', true],
    ['jsxs', false],
    ['jsxs', true],
    ['jsxDEV', false],
    ['jsxDEV', true],
    ['createElement', false],
    ['createElement', true],
  ] as const)(
    'forwards cloneElement replacements through %s when observation enabled=%s',
    (runtimeKind, enabled) => {
      interface ScrollHandle {
        readonly variant: string;
      }
      interface ScrollProps {
        children?: React.ReactNode;
        componentName: string;
        onRefresh(): void;
        originalProps: string;
        renderOriginal: string;
        variant: string;
      }

      const events: ALUIEventData[] = [];
      const applicationHandler = jest.fn(() => 'refreshed');
      const originalRef = React.createRef<ScrollHandle>();
      const replacementRef = React.createRef<ScrollHandle>();
      let receivedProps: ScrollProps | null = null;
      const ScrollView = React.forwardRef<ScrollHandle, ScrollProps>(
        (props, ref) => {
          receivedProps = props;
          React.useImperativeHandle(ref, () => ({ variant: props.variant }), [
            props.variant,
          ]);
          return React.createElement(
            'scroll-view',
            { onRefresh: props.onRefresh, variant: props.variant },
            props.children
          );
        }
      );
      ScrollView.displayName = 'ScrollView';

      addChannelSubscriber('al_ui_event', (event) => events.push(event));
      initializeAutoLogging({
        appName: 'test',
        enabled,
        heartbeatInterval: false,
      });

      const originalProps = {
        children: runtimeKind === 'jsxs' ? ['original-cell'] : 'original-cell',
        componentName: 'application-component-name',
        onRefresh: applicationHandler,
        originalProps: 'application-original-props',
        ref: originalRef,
        renderOriginal: 'application-render-original',
        variant: 'original-variant',
      };
      let originalElement: React.ReactElement;
      switch (runtimeKind) {
        case 'jsx':
          originalElement = jsx(ScrollView, originalProps, 'original-key');
          break;
        case 'jsxs':
          originalElement = jsxs(ScrollView, originalProps, 'original-key');
          break;
        case 'jsxDEV':
          originalElement = jsxDEV(
            ScrollView,
            originalProps,
            'original-key',
            false,
            { fileName: 'fixture.tsx', lineNumber: 1, columnNumber: 1 },
            undefined
          );
          break;
        case 'createElement':
          originalElement = createObservedJSXFunction(
            React.createElement,
            'createElement'
          )(
            ScrollView,
            { ...originalProps, children: undefined },
            'original-cell'
          ) as React.ReactElement;
          break;
      }

      const clonedElement = React.cloneElement(
        originalElement,
        {
          key: 'cloned-key',
          ref: replacementRef,
          variant: 'cloned-variant',
        },
        'injected-cell'
      );
      expect(clonedElement.key).toBe('cloned-key');

      let renderer: TestRenderer.ReactTestRenderer | null = null;
      act(() => {
        renderer = TestRenderer.create(clonedElement);
      });
      if (renderer == null) throw new Error('Expected a mounted renderer');
      const mountedRenderer = renderer as TestRenderer.ReactTestRenderer;
      expect(originalRef.current).toBeNull();
      expect(replacementRef.current).toEqual({ variant: 'cloned-variant' });
      expect(receivedProps).toEqual(
        expect.objectContaining({
          children: 'injected-cell',
          componentName: 'application-component-name',
          originalProps: 'application-original-props',
          renderOriginal: 'application-render-original',
          variant: 'cloned-variant',
        })
      );
      expect(Object.keys(receivedProps ?? {}).sort()).toEqual(
        [
          'children',
          'componentName',
          'onRefresh',
          'originalProps',
          'renderOriginal',
          'variant',
        ].sort()
      );

      const installedHandler = receivedProps?.onRefresh;
      expect(installedHandler?.()).toBe('refreshed');
      expect(applicationHandler).toHaveBeenCalledTimes(1);
      expect(events).toHaveLength(enabled ? 1 : 0);

      const updatedClone = React.cloneElement(
        originalElement,
        {
          key: 'cloned-key',
          ref: replacementRef,
          variant: 'updated-variant',
        },
        'updated-cell'
      );
      act(() => mountedRenderer.update(updatedClone));
      expect(receivedProps?.children).toBe('updated-cell');
      expect(receivedProps?.variant).toBe('updated-variant');
      expect(receivedProps?.onRefresh).toBe(installedHandler);
      expect(replacementRef.current).toEqual({ variant: 'updated-variant' });
      act(() => mountedRenderer.unmount());
    }
  );

  it('keeps distinct snapshots for elements that share an application handler', () => {
    const events: ALUIEventData[] = [];
    const applicationHandler = jest.fn();
    addChannelSubscriber('al_ui_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });

    function Pressable(props: { accessibilityLabel: string; onPress(): void }) {
      return React.createElement('button', props);
    }

    let renderer: TestRenderer.ReactTestRenderer | null = null;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            ALSurface,
            { name: 'first_surface' },
            jsx(Pressable, {
              accessibilityLabel: 'First action',
              onPress: applicationHandler,
            })
          ),
          React.createElement(
            ALSurface,
            { name: 'second_surface' },
            jsx(Pressable, {
              accessibilityLabel: 'Second action',
              onPress: applicationHandler,
            })
          )
        )
      );
    });
    if (renderer == null) throw new Error('Expected a mounted renderer');
    const buttons = (
      renderer as TestRenderer.ReactTestRenderer
    ).root.findAllByType('button');
    expect(buttons[0].props.onPress).not.toBe(buttons[1].props.onPress);
    buttons[0].props.onPress();
    buttons[1].props.onPress();

    expect(applicationHandler).toHaveBeenCalledTimes(2);
    expect(events.map((event) => event.elementText)).toEqual([
      'First action',
      'Second action',
    ]);
    expect(events.map((event) => event.surface)).toEqual([
      'first_surface',
      'second_surface',
    ]);
  });

  it('uses the unwrapped createElement after legacy runtime installation', () => {
    let createElementCalls = 0;
    const invokeReactCreateElement = React.createElement as unknown as (
      ...args: unknown[]
    ) => React.ReactElement;
    const originalCreateElement = function (
      this: unknown,
      ...args: unknown[]
    ): React.ReactElement {
      createElementCalls++;
      return invokeReactCreateElement.apply(React, args);
    };
    const reactModule = { createElement: originalCreateElement };
    installReactNativeJSXRuntime(reactModule);
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });

    function Refreshable(props: {
      onLongPress?: () => void;
      onRefresh(): void;
    }) {
      return React.createElement('scroll-view', props);
    }

    let renderer: TestRenderer.ReactTestRenderer | null = null;
    act(() => {
      renderer = TestRenderer.create(
        reactModule.createElement(Refreshable, {
          onLongPress: undefined,
          onRefresh: () => undefined,
        })
      );
    });
    if (renderer == null) throw new Error('Expected a mounted renderer');
    expect(
      (renderer as TestRenderer.ReactTestRenderer).root.findByType(
        'scroll-view'
      )
    ).toBeDefined();
    expect(createElementCalls).toBe(2);
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
