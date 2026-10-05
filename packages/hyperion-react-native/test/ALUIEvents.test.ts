/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React, { Suspense } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import * as AutoLogging from '../src/AutoLogging';
import { reactNativeSurfaces, ALSurface } from '../src/ALSurface';
import { reactNativeUIEvents } from '../src/ALUIEvents';
import type { ALReactNativeEventMap, ALUIEventData } from '../src/ALTypes';
import {
  createObservedJSXFunction,
  resetElementObservationForTests,
} from '../src/ReactNativeElementObservation';
import { jsxDEV } from '../src/jsx-dev-runtime';
import { jsx, jsxs } from '../src/jsx-runtime';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

function mount(element: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  if (renderer == null) throw new Error('Expected a mounted renderer.');
  return renderer;
}

interface InstrumentedControlProps {
  readonly accessibilityLabel: string;
  readonly children?: React.ReactNode;
  readonly onChange?: (event: unknown) => unknown;
  readonly onPress?: (event: unknown) => unknown;
  readonly onScroll?: (event: unknown) => unknown;
  readonly onValueChange?: (value: number) => unknown;
}

function InstrumentedControl(props: InstrumentedControlProps) {
  return React.createElement('instrumented-control', props, props.children);
}

function createNativeEvent(nativeEvent: object = {}): {
  readonly nativeEvent: object;
} {
  return { nativeEvent };
}

describe('React Native automatic UI event plugin', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (String(args[0]).includes('react-test-renderer is deprecated')) return;
      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    AutoLogging.dispose();
    resetElementObservationForTests();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('isolates subscribers and preserves handler receiver, arguments, result, and order', () => {
    const subscriberErrors: unknown[] = [];
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>((error) =>
      subscriberErrors.push(error)
    );
    const events: ALUIEventData[] = [];
    const order: string[] = [];
    channel.addListener('al_ui_event', () => {
      order.push('failing-subscriber');
      throw new Error('subscriber failure');
    });
    channel.addListener('al_ui_event', (event) => {
      order.push('subscriber');
      events.push(event);
    });
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const receiver = { name: 'receiver' };
    const argument = { private: 'argument' };
    const applicationHandler = jest.fn(function (
      this: unknown,
      value: unknown
    ) {
      order.push('application');
      expect(this).toBe(receiver);
      expect(value).toBe(argument);
      return 'application-result';
    });
    function Pressable(props: {
      accessibilityLabel: string;
      onPress(value: unknown): unknown;
    }) {
      return React.createElement('pressable', props);
    }
    const renderer = mount(
      jsx(Pressable, {
        accessibilityLabel: 'Save',
        onPress: applicationHandler,
      })
    );

    const installedHandler = renderer.root.findByType('pressable').props
      .onPress as (this: unknown, value: unknown) => unknown;
    expect(installedHandler.call(receiver, argument)).toBe(
      'application-result'
    );

    expect(order).toEqual(['failing-subscriber', 'subscriber', 'application']);
    expect(subscriberErrors).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        event: 'click',
        eventIndex: 0,
        elementText: 'Save',
        elementTextSource: 'accessibilityLabel',
        elementTextSourceType: 'application_text',
        elementTextPotentiallySensitive: true,
        sourceProp: 'onPress',
      })
    );
    expect(JSON.stringify(events[0])).not.toContain('private');
    act(() => renderer.unmount());
  });

  test('logs a native interaction once when parent and child forward the same handler', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const applicationHandler = jest.fn();
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const renderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Parent action',
        onPress: applicationHandler,
        children: jsx(InstrumentedControl, {
          accessibilityLabel: 'Child action',
          onPress: applicationHandler,
        }),
      })
    );
    const controls = renderer.root.findAllByType('instrumented-control');
    const nativeEvent = {};

    controls[1].props.onPress(createNativeEvent(nativeEvent));
    controls[0].props.onPress(createNativeEvent(nativeEvent));

    expect(applicationHandler).toHaveBeenCalledTimes(2);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({ event: 'click', elementText: 'Child action' })
    );
    act(() => renderer.unmount());
  });

  test('logs once when a nested handler drops the original event', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const childHandler = jest.fn();
    const installedHandlers: { child?: () => unknown } = {};
    const parentHandler = jest.fn(() => installedHandlers.child?.());
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const renderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Parent action',
        onPress: parentHandler,
        children: jsx(InstrumentedControl, {
          accessibilityLabel: 'Child action',
          onPress: childHandler,
        }),
      })
    );
    const controls = renderer.root.findAllByType('instrumented-control');
    installedHandlers.child = controls[1].props.onPress;

    controls[0].props.onPress(createNativeEvent());

    expect(parentHandler).toHaveBeenCalledTimes(1);
    expect(childHandler).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(events[0].elementText).toBe('Parent action');
    act(() => renderer.unmount());
  });

  test('suppresses callback-derived changes but logs a genuine native change', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const changeHandler = jest.fn();
    const forwardedNativeEvent = { text: 'forwarded' };
    const installedHandlers: {
      change?: (event: { nativeEvent: object }) => unknown;
    } = {};
    const pressHandler = jest.fn(() =>
      installedHandlers.change?.(createNativeEvent(forwardedNativeEvent))
    );
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeUIEvents({ interceptProps: ['onPress', 'onChange'] }),
      ],
    });
    const renderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Composed control',
        onPress: pressHandler,
        onChange: changeHandler,
      })
    );
    const control = renderer.root.findByType('instrumented-control');
    installedHandlers.change = control.props.onChange;

    control.props.onPress(createNativeEvent());
    expect(events.map((event) => event.event)).toEqual(['click']);

    installedHandlers.change?.(createNativeEvent(forwardedNativeEvent));
    expect(events.map((event) => event.event)).toEqual(['click', 'change']);
    expect(pressHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenCalledTimes(2);
    act(() => renderer.unmount());
  });

  test('logs distinct native event identities independently', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const applicationHandler = jest.fn();
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const renderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Action',
        onPress: applicationHandler,
      })
    );
    const installedHandler = renderer.root.findByType('instrumented-control')
      .props.onPress;
    const firstNativeEvent = {};

    installedHandler(createNativeEvent(firstNativeEvent));
    installedHandler(createNativeEvent(firstNativeEvent));
    installedHandler(createNativeEvent({}));

    expect(applicationHandler).toHaveBeenCalledTimes(3);
    expect(events).toHaveLength(2);
    act(() => renderer.unmount());
  });

  test('logs distinct semantic event types that share one native event', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const pressHandler = jest.fn();
    const changeHandler = jest.fn();
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeUIEvents({ interceptProps: ['onPress', 'onChange'] }),
      ],
    });
    const renderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Shared native event',
        onPress: pressHandler,
        onChange: changeHandler,
      })
    );
    const control = renderer.root.findByType('instrumented-control');
    const nativeEvent = { text: 'shared' };

    control.props.onPress(createNativeEvent(nativeEvent));
    control.props.onChange(createNativeEvent(nativeEvent));
    control.props.onPress(createNativeEvent(nativeEvent));
    control.props.onChange(createNativeEvent(nativeEvent));

    expect(pressHandler).toHaveBeenCalledTimes(2);
    expect(changeHandler).toHaveBeenCalledTimes(2);
    expect(events.map((event) => event.event)).toEqual(['click', 'change']);
    act(() => renderer.unmount());
  });

  test('clears the synchronous guard when an application handler throws', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const error = new Error('application failure');
    const changeHandler = jest.fn();
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeUIEvents({ interceptProps: ['onPress', 'onChange'] }),
      ],
    });
    const renderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Throwing control',
        onPress() {
          throw error;
        },
        onChange: changeHandler,
      })
    );
    const control = renderer.root.findByType('instrumented-control');

    expect(() => control.props.onPress(createNativeEvent())).toThrow(error);
    control.props.onChange(createNativeEvent());

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(events.map((event) => event.event)).toEqual(['click', 'change']);
    act(() => renderer.unmount());
  });

  test('resets native-event identity tracking when the plugin is disposed', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const applicationHandler = jest.fn();
    const plugin = reactNativeUIEvents();
    const nativeEvent = {};
    channel.addListener('al_ui_event', (event) => events.push(event));

    AutoLogging.init({ channel, plugins: [plugin] });
    const firstRenderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'First runtime',
        onPress: applicationHandler,
      })
    );
    firstRenderer.root
      .findByType('instrumented-control')
      .props.onPress(createNativeEvent(nativeEvent));
    act(() => firstRenderer.unmount());
    expect(AutoLogging.dispose()).toBe(true);

    AutoLogging.init({ channel, plugins: [plugin] });
    const secondRenderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Second runtime',
        onPress: applicationHandler,
      })
    );
    secondRenderer.root
      .findByType('instrumented-control')
      .props.onPress(createNativeEvent(nativeEvent));

    expect(applicationHandler).toHaveBeenCalledTimes(2);
    expect(events.map((event) => event.elementText)).toEqual([
      'First runtime',
      'Second runtime',
    ]);
    act(() => secondRenderer.unmount());
  });

  test('preserves scroll throttling and value-change debouncing', () => {
    jest.useFakeTimers();
    jest.setSystemTime(10_000);
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const scrollHandler = jest.fn();
    const valueHandler = jest.fn();
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeUIEvents({
          interceptProps: ['onScroll', 'onValueChange'],
        }),
      ],
    });
    const renderer = mount(
      jsx(InstrumentedControl, {
        accessibilityLabel: 'Debounced control',
        onScroll: scrollHandler,
        onValueChange: valueHandler,
      })
    );
    const control = renderer.root.findByType('instrumented-control');

    control.props.onScroll(createNativeEvent());
    jest.setSystemTime(11_000);
    control.props.onScroll(createNativeEvent());
    jest.setSystemTime(16_000);
    control.props.onScroll(createNativeEvent());
    control.props.onValueChange(1);
    control.props.onValueChange(2);

    expect(scrollHandler).toHaveBeenCalledTimes(3);
    expect(valueHandler).toHaveBeenCalledTimes(2);
    expect(events.map((event) => event.event)).toEqual(['scroll', 'scroll']);
    act(() => jest.advanceTimersByTime(500));
    expect(events.map((event) => event.event)).toEqual([
      'scroll',
      'scroll',
      'change',
    ]);
    expect(events[2]).toEqual(expect.objectContaining({ value: 2 }));
    act(() => renderer.unmount());
  });

  test('publishes raw input values with source and sensitivity provenance', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const applicationHandler = jest.fn();
    function TextInput(props: {
      onChangeText(value: string): void;
      placeholder: string;
    }) {
      return React.createElement('text-input', props);
    }
    const renderer = mount(
      jsx(TextInput, {
        onChangeText: applicationHandler,
        placeholder: 'Account email',
      })
    );

    renderer.root
      .findByType('text-input')
      .props.onChangeText('person@example.com');
    expect(applicationHandler).toHaveBeenCalledWith('person@example.com');
    expect(events[0]).toEqual(
      expect.objectContaining({
        elementText: 'Account email',
        elementTextSource: 'placeholder',
        elementTextSourceType: 'application_text',
        elementTextPotentiallySensitive: true,
        value: 'person@example.com',
        valueSource: 'callback_argument',
        valueSourceType: 'user_input',
        valuePotentiallySensitive: true,
      })
    );
    act(() => renderer.unmount());
  });

  test('keeps a stable wrapper bound to the latest committed callback', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const first = jest.fn(() => 'first');
    const second = jest.fn(() => 'second');
    function Pressable(props: { onPress?: () => string }) {
      return React.createElement('pressable', props);
    }
    const renderer = mount(jsx(Pressable, { onPress: first }));
    const stableHandler = renderer.root.findByType('pressable').props.onPress;

    act(() => renderer.update(jsx(Pressable, { onPress: undefined })));
    expect(renderer.root.findByType('pressable').props.onPress).toBeUndefined();
    act(() => renderer.update(jsx(Pressable, { onPress: second })));
    const updatedHandler = renderer.root.findByType('pressable').props.onPress;
    expect(updatedHandler).toBe(stableHandler);
    expect(updatedHandler()).toBe('second');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });

  test('retains the last committed snapshot after a suspended render', async () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const first = jest.fn(() => 'first');
    const suspended = jest.fn(() => 'suspended');
    const pending = new Promise<void>(() => undefined);
    function Pressable(props: { onPress(): string }) {
      return React.createElement('pressable', props);
    }
    function MaybeSuspend({ active }: { active: boolean }) {
      if (active) throw pending;
      return null;
    }
    function Tree({
      handler,
      shouldSuspend,
    }: {
      handler(): string;
      shouldSuspend: boolean;
    }) {
      return React.createElement(
        Suspense,
        { fallback: null },
        jsx(Pressable, { onPress: handler }),
        React.createElement(MaybeSuspend, { active: shouldSuspend })
      );
    }

    const renderer = mount(
      React.createElement(Tree, { handler: first, shouldSuspend: false })
    );
    const committedHandler = renderer.root.findByType('pressable').props
      .onPress as () => string;
    await act(async () => {
      renderer.update(
        React.createElement(Tree, {
          handler: suspended,
          shouldSuspend: true,
        })
      );
    });

    expect(committedHandler()).toBe('first');
    expect(suspended).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  test('preserves React use() suspension and retry with observation enabled or disabled', async () => {
    async function runFixture(enabled: boolean) {
      let resolveLabel: ((value: string) => void) | undefined;
      const labelPromise = new Promise<string>((resolve) => {
        resolveLabel = resolve;
      });
      const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
      const events: ALUIEventData[] = [];
      const applicationHandler = jest.fn();
      let applicationMounts = 0;
      let applicationUnmounts = 0;
      channel.addListener('al_ui_event', (event) => events.push(event));
      AutoLogging.init({
        channel,
        plugins: enabled ? [reactNativeUIEvents()] : [],
      });

      function Pressable(props: {
        accessibilityLabel: string;
        children: React.ReactNode;
        onPress(): void;
        revision: number;
      }) {
        return React.createElement('pressable', props, props.children);
      }
      function SuspendedLabel() {
        return React.createElement('text', null, React.use(labelPromise));
      }
      function ApplicationContent({ revision }: { revision: number }) {
        React.useEffect(() => {
          applicationMounts++;
          return () => {
            applicationUnmounts++;
          };
        }, []);
        return jsx(Pressable, {
          accessibilityLabel: 'Suspended action',
          onPress: applicationHandler,
          revision,
          children: React.createElement(SuspendedLabel),
        });
      }
      const createTree = (revision: number) =>
        React.createElement(
          Suspense,
          { fallback: React.createElement('text', null, 'Loading') },
          React.createElement(ApplicationContent, { revision })
        );

      let renderer: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        renderer = TestRenderer.create(createTree(0));
      });
      if (renderer == null) throw new Error('Expected a mounted renderer.');
      expect(renderer.root.findByType('text').children).toEqual(['Loading']);

      await act(async () => {
        resolveLabel?.('Ready');
        await labelPromise;
      });
      expect(renderer.root.findByType('text').children).toEqual(['Ready']);
      await act(async () => {
        renderer?.update(createTree(1));
      });
      const pressable = renderer.root.findByType('pressable');
      expect(pressable.props.revision).toBe(1);
      pressable.props.onPress();
      expect(applicationHandler).toHaveBeenCalledTimes(1);
      expect(events).toHaveLength(enabled ? 1 : 0);
      expect(applicationMounts).toBe(1);
      const visibleTree = JSON.parse(JSON.stringify(renderer.toJSON()));

      act(() => renderer?.unmount());
      expect(applicationUnmounts).toBe(1);
      AutoLogging.dispose();
      resetElementObservationForTests();
      return visibleTree;
    }

    const disabledTree = await runFixture(false);
    const enabledTree = await runFixture(true);
    expect(enabledTree).toEqual(disabledTree);
    const conditionalUseWarnings = (
      console.error as jest.MockedFunction<typeof console.error>
    ).mock.calls.filter((args) =>
      String(args[0]).includes(
        'called use() to suspend in a previous render but did not call use()'
      )
    );
    expect(conditionalUseWarnings).toHaveLength(0);
  });

  test('preserves application handler exceptions', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({ channel, plugins: [reactNativeUIEvents()] });
    const error = new Error('application failure');
    function Pressable(props: { onPress(): void }) {
      return React.createElement('pressable', props);
    }
    const renderer = mount(
      jsx(Pressable, {
        onPress() {
          throw error;
        },
      })
    );
    expect(() => renderer.root.findByType('pressable').props.onPress()).toThrow(
      error
    );
    act(() => renderer.unmount());
  });

  test.each([
    ['jsx', false],
    ['jsx', true],
    ['jsxs', false],
    ['jsxs', true],
    ['jsxDEV', false],
    ['jsxDEV', true],
    ['createElement', false],
    ['createElement', true],
  ] as const)(
    'forwards cloneElement replacements through %s when enabled=%s',
    (runtimeKind, enabled) => {
      interface ScrollHandle {
        readonly variant: string;
      }
      interface ScrollProps {
        children?: React.ReactNode;
        componentName: string;
        onRefresh(): string;
        originalProps: string;
        renderOriginal: string;
        variant: string;
      }

      const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
      const events: ALUIEventData[] = [];
      channel.addListener('al_ui_event', (event) => events.push(event));
      AutoLogging.init({
        channel,
        plugins: enabled ? [reactNativeUIEvents()] : [],
      });
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
      const renderer = mount(clonedElement);

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
      act(() => renderer.update(updatedClone));
      expect(receivedProps?.children).toBe('updated-cell');
      expect(receivedProps?.variant).toBe('updated-variant');
      expect(receivedProps?.onRefresh).toBe(installedHandler);
      expect(replacementRef.current).toEqual({ variant: 'updated-variant' });
      act(() => renderer.unmount());
    }
  );

  test('keeps shared-handler siblings on distinct surface snapshots', async () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    const surfaceEvents: string[] = [];
    const applicationHandler = jest.fn();
    channel.addListener('al_ui_event', (event) => events.push(event));
    channel.addListener('al_surface_mutation_event', (event) =>
      surfaceEvents.push(event.event)
    );
    AutoLogging.init({
      channel,
      plugins: [reactNativeSurfaces(), reactNativeUIEvents()],
    });
    function Pressable(props: { accessibilityLabel: string; onPress(): void }) {
      return React.createElement('pressable', props);
    }
    const renderer = mount(
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
    await act(async () => Promise.resolve());
    const controls = renderer.root.findAllByType('pressable');
    expect(controls[0].props.onPress).not.toBe(controls[1].props.onPress);
    controls[0].props.onPress();
    controls[1].props.onPress();

    expect(applicationHandler).toHaveBeenCalledTimes(2);
    expect(events.map((event) => event.elementText)).toEqual([
      'First action',
      'Second action',
    ]);
    expect(events.map((event) => event.surface)).toEqual([
      'first_surface',
      'second_surface',
    ]);
    expect(surfaceEvents).toEqual(['mount_component', 'mount_component']);
    act(() => renderer.unmount());
    await act(async () => Promise.resolve());
  });

  test('cleans delayed value events and disables mounted wrappers on dispose', () => {
    jest.useFakeTimers();
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALUIEventData[] = [];
    channel.addListener('al_ui_event', (event) => events.push(event));
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeUIEvents({ interceptProps: ['onValueChange', 'onPress'] }),
      ],
    });
    const handler = jest.fn();
    function Control(props: {
      onPress(): void;
      onValueChange(value: number): void;
    }) {
      return React.createElement('control', props);
    }
    const renderer = mount(
      jsx(Control, { onPress: handler, onValueChange: handler })
    );
    const control = renderer.root.findByType('control');
    control.props.onValueChange(2);
    expect(AutoLogging.dispose()).toBe(true);
    control.props.onPress();
    act(() => jest.runAllTimers());
    act(() => renderer.unmount());

    expect(handler).toHaveBeenCalledTimes(2);
    expect(events).toHaveLength(0);
  });

  test('skips non-interactable, suppressed, invalid, and host elements', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeUIEvents({
          componentNameValidator: (name) => name !== 'Ignored',
        }),
      ],
    });
    function Ignored(props: { onPress(): void }) {
      return React.createElement('ignored', props);
    }
    function Plain() {
      return null;
    }

    expect(jsx(Plain, {}).type).toBe(Plain);
    expect(jsx(Ignored, { onPress: () => undefined }).type).toBe(Ignored);
    expect(
      jsx(Ignored, {
        'data-disable-logging': true,
        onPress: () => undefined,
      } as never).type
    ).toBe(Ignored);
    expect(jsx('host', { onPress: () => undefined }).type).toBe('host');
  });
});
