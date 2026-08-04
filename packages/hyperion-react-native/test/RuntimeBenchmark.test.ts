/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  createObservedJSXFunction,
  setElementInstrumenter,
  setElementObservationEnabled,
} from '../src/ReactNativeElementObservation';
import { jsx } from '../src/jsx-runtime';
import { addChannelSubscriber } from '../src/ALChannel';
import {
  initializeAutoLogging,
  resetALRuntimeForTests,
} from '../src/ALRuntime';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => undefined }),
  },
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const benchmark =
  process.env.HYPERION_RUNTIME_BENCHMARK === '1' ? describe : describe.skip;

function p95Microseconds(
  operation: () => void,
  iterations = 1_000,
  sampleCount = 80
): number {
  for (let index = 0; index < 10_000; index++) operation();
  const samples: number[] = [];
  for (let sample = 0; sample < sampleCount; sample++) {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) operation();
    samples.push(((performance.now() - start) * 1_000) / iterations);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length * 0.95)];
}

benchmark('React Native AutoLogging runtime budgets', () => {
  afterEach(() => {
    resetALRuntimeForTests();
    setElementObservationEnabled(false);
    setElementInstrumenter(null);
  });

  it('meets disabled, scan, wrapper, and synchronous handler P95 budgets', () => {
    const original = (type: unknown, props: unknown, key?: unknown) => ({
      key,
      props,
      type,
    });
    const wrapped = createObservedJSXFunction(original);

    setElementObservationEnabled(false);
    const disabled = p95Microseconds(() => {
      wrapped('View', null);
    });

    initializeAutoLogging({
      appName: 'benchmark',
      enabled: false,
      heartbeatInterval: false,
    });
    const initializedDisabled = p95Microseconds(() => {
      wrapped('Button', { onPress: applicationHandler }, 'key');
    });
    resetALRuntimeForTests();

    const trackedProps = [
      'onPress',
      'onLongPress',
      'onChangeText',
      'onSubmitEditing',
      'onFocus',
      'onBlur',
      'onRefresh',
    ];
    setElementInstrumenter((_type, props) => {
      for (const propName of trackedProps) {
        if (props != null && propName in props) return null;
      }
      return null;
    });
    setElementObservationEnabled(true);
    const nonInteractable = p95Microseconds(() => {
      wrapped('View', { testID: 'fixture' });
    });

    const Wrapper = () => null;
    setElementInstrumenter(() => ({ type: Wrapper }));
    const wrapper = p95Microseconds(() => {
      wrapped('Button', { onPress: applicationHandler }, 'key');
    });

    resetALRuntimeForTests();
    let handled = 0;
    let dispatched = 0;
    function applicationHandler() {
      handled++;
    }
    function Button(props: { onPress(): void }) {
      return React.createElement('button', props);
    }
    addChannelSubscriber('al_ui_event', () => dispatched++);
    initializeAutoLogging({ appName: 'benchmark', heartbeatInterval: false });
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        jsx(Button, {
          accessibilityLabel: 'Benchmark',
          onPress: applicationHandler,
        })
      );
    });
    const handler = renderer!.root.findByType('button').props.onPress;
    const handlerDispatch = p95Microseconds(handler, 250, 60);
    const observedElement = jsx(Button, {
      accessibilityLabel: 'Benchmark',
      onPress: applicationHandler,
    });
    const clonedObserved = p95Microseconds(
      () => {
        React.cloneElement(observedElement, {
          accessibilityLabel: 'Cloned benchmark',
          children: 'Injected cell',
        });
      },
      250,
      60
    );

    console.info(
      JSON.stringify({
        disabled,
        initializedDisabled,
        nonInteractable,
        wrapper,
        clonedObserved,
        handlerDispatch,
      })
    );
    expect(disabled).toBeLessThanOrEqual(1);
    expect(initializedDisabled).toBeLessThanOrEqual(1);
    expect(nonInteractable).toBeLessThanOrEqual(3);
    expect(wrapper).toBeLessThanOrEqual(8);
    expect(clonedObserved).toBeLessThanOrEqual(15);
    expect(handlerDispatch).toBeLessThanOrEqual(15);
    expect(handled).toBe(dispatched);
    act(() => renderer!.unmount());
  });

  it('meets render/commit and mounted heap budgets', () => {
    const originalConsoleError = console.error;
    console.error = () => undefined;
    function Button(props: { onPress(): void }) {
      return React.createElement('button', props);
    }
    const applicationHandler = () => undefined;
    initializeAutoLogging({ appName: 'benchmark', heartbeatInterval: false });

    const renderSamples: number[] = [];
    for (let sample = 0; sample < 24; sample++) {
      const elements = Array.from({ length: 100 }, (_, index) =>
        jsx(
          Button,
          { accessibilityLabel: 'Benchmark', onPress: applicationHandler },
          String(index)
        )
      );
      let renderer: TestRenderer.ReactTestRenderer;
      const start = performance.now();
      act(() => {
        renderer = TestRenderer.create(
          React.createElement(React.Fragment, null, elements)
        );
      });
      renderSamples.push(
        ((performance.now() - start) * 1_000) / elements.length
      );
      act(() => renderer!.unmount());
    }
    renderSamples.sort((a, b) => a - b);
    const renderCommit = renderSamples[Math.floor(renderSamples.length * 0.95)];

    const heapPerWrapper = measureMountedHeapPerWrapper(Button);
    console.error = originalConsoleError;
    console.info(
      JSON.stringify({
        environment: 'node-react-test-renderer-development',
        renderCommit,
        renderCommitReleaseHermesBudget: 60,
        heapPerWrapper,
        heapPerWrapperReleaseHermesBudget: 4_096,
      })
    );
    if (process.env.HYPERION_RELEASE_HERMES_BENCHMARK === '1') {
      expect(renderCommit).toBeLessThanOrEqual(60);
      expect(heapPerWrapper).toBeLessThanOrEqual(4_096);
    }
  });
});

function measureMountedHeapPerWrapper(
  Button: React.ComponentType<{ onPress(): void }>
): number {
  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
  if (gc == null) throw new Error('Run the benchmark with --expose-gc');
  const count = 1_000;
  const handler = () => undefined;
  const render = () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(
          React.Fragment,
          null,
          Array.from({ length: count }, (_, index) =>
            jsx(
              Button,
              { accessibilityLabel: 'Benchmark', onPress: handler },
              String(index)
            )
          )
        )
      );
    });
    return renderer!;
  };

  setElementObservationEnabled(false);
  gc();
  const baselineBefore = process.memoryUsage().heapUsed;
  const baselineRenderer = render();
  gc();
  const baselineMounted = process.memoryUsage().heapUsed;
  act(() => baselineRenderer.unmount());
  gc();

  setElementObservationEnabled(true);
  const instrumentedBefore = process.memoryUsage().heapUsed;
  const instrumentedRenderer = render();
  gc();
  const instrumentedMounted = process.memoryUsage().heapUsed;
  act(() => instrumentedRenderer.unmount());
  gc();
  const baselineBytes = baselineMounted - baselineBefore;
  const instrumentedBytes = instrumentedMounted - instrumentedBefore;
  return Math.max(0, (instrumentedBytes - baselineBytes) / count);
}
