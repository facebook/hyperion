/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { ALHeartbeatType } from 'hyperion-autologging/src/ALHeartbeatType';
import {
  reactNativeAppLifecycle,
  type ReactNativeAppLifecycleOptions,
} from '../src/ALAppLifecycle';
import { reactNativeAppStateEvents } from '../src/ALAppStateEvents';
import { reactNativeHeartbeat } from '../src/ALHeartbeat';
import { reactNativeUIEvents } from '../src/ALUIEvents';
import type {
  ALAppStateEventData,
  ALHeartbeatEventData,
  ALReactNativeEventMap,
} from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';
import type { AppStateStatus, ReactNativeAppState } from '../src/IReactNative';
import { resetElementObservationForTests } from '../src/ReactNativeElementObservation';
import { jsx } from '../src/jsx-runtime';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

interface FakeAppState extends ReactNativeAppState {
  transition(state: AppStateStatus): void;
  readonly addListenerCalls: number;
  readonly currentStateReads: number;
  readonly removeCalls: number;
}

function createFakeLifecycle(
  initialState: AppStateStatus
): ReactNativeAppLifecycleOptions & { readonly AppState: FakeAppState } {
  let state = initialState;
  let listener: ((state: AppStateStatus) => void) | null = null;
  let addListenerCalls = 0;
  let currentStateReads = 0;
  let removeCalls = 0;
  const AppState: FakeAppState = {
    get currentState() {
      currentStateReads++;
      return state;
    },
    addEventListener(type, nextListener) {
      expect(type).toBe('change');
      addListenerCalls++;
      listener = nextListener;
      return {
        remove() {
          removeCalls++;
          listener = null;
        },
      };
    },
    transition(nextState) {
      state = nextState;
      listener?.(nextState);
    },
    get addListenerCalls() {
      return addListenerCalls;
    },
    get currentStateReads() {
      return currentStateReads;
    },
    get removeCalls() {
      return removeCalls;
    },
  };
  return { AppState };
}

describe('React Native lifecycle plugins', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });
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

  test('shares one AppState subscription across heartbeat and app-state events', () => {
    const fake = createFakeLifecycle('active');
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const heartbeats: ALHeartbeatEventData[] = [];
    const appStates: ALAppStateEventData[] = [];
    channel.addListener('al_heartbeat_event', (event) =>
      heartbeats.push(event)
    );
    channel.addListener('al_app_state_event', (event) => appStates.push(event));

    AutoLogging.init({
      channel,
      plugins: [
        reactNativeAppLifecycle(fake),
        reactNativeHeartbeat({
          heartbeatInterval: 100,
          maxUserInactivityDuration: 1_000,
        }),
        reactNativeAppStateEvents(),
      ],
    });

    expect(fake.AppState.currentStateReads).toBe(1);
    expect(fake.AppState.addListenerCalls).toBe(1);
    expect(jest.getTimerCount()).toBe(1);

    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(10);
    fake.AppState.transition('inactive');
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(10);
    fake.AppState.transition('active');
    expect(jest.getTimerCount()).toBe(1);
    jest.advanceTimersByTime(10);
    fake.AppState.transition('background');
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(100);
    fake.AppState.transition('active');

    expect(heartbeats.map((event) => event.heartbeatType)).toEqual([
      ALHeartbeatType.START,
      ALHeartbeatType.SCHEDULED,
      ALHeartbeatType.PAGE_FOCUS_LOST,
      ALHeartbeatType.PAGE_FOCUS_GAINED,
      ALHeartbeatType.PAGE_FOCUS_LOST,
      ALHeartbeatType.REGAIN_PAGE_VISIBILITY,
    ]);
    expect(appStates.map((event) => event.appState)).toEqual([
      'inactive',
      'active',
      'background',
      'active',
    ]);
    expect(
      [...heartbeats, ...appStates]
        .map((event) => event.eventIndex)
        .sort((left, right) => left - right)
    ).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(appStates[0].eventTimestamp).toBe(heartbeats[2].eventTimestamp);

    expect(AutoLogging.dispose()).toBe(true);
    expect(fake.AppState.removeCalls).toBe(1);
    expect(jest.getTimerCount()).toBe(0);
    expect(heartbeats.at(-1)?.heartbeatType).toBe(ALHeartbeatType.STOP);
  });

  test('does not create AppState subscriptions or timers when lifecycle plugins are absent', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();

    expect(() => AutoLogging.init({ channel, plugins: [] })).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });

  test('fails clearly when the lifecycle plugin has no AppState adapter', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    expect(() =>
      AutoLogging.init({
        channel,
        plugins: [reactNativeAppLifecycle({ AppState: undefined as never })],
      })
    ).toThrow('React Native app lifecycle requires AppState.');
    expect(AutoLogging.isInitialized()).toBe(false);
  });

  test('fails clearly when heartbeat is configured without lifecycle', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    expect(() =>
      AutoLogging.init({ channel, plugins: [reactNativeHeartbeat()] })
    ).toThrow(
      'AutoLogging plugin "react-native-heartbeat" requires missing plugin "react-native-app-lifecycle".'
    );
    expect(AutoLogging.isInitialized()).toBe(false);
  });

  test('starts no interval while initially backgrounded', () => {
    const fake = createFakeLifecycle('background');
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const heartbeats: ALHeartbeatEventData[] = [];
    channel.addListener('al_heartbeat_event', (event) =>
      heartbeats.push(event)
    );
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeAppLifecycle(fake),
        reactNativeHeartbeat({ heartbeatInterval: 100 }),
      ],
    });

    expect(heartbeats.map((event) => event.heartbeatType)).toEqual([
      ALHeartbeatType.START,
    ]);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('suppresses inactive heartbeats and resumes after direct UI activity', () => {
    const fake = createFakeLifecycle('active');
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const heartbeats: ALHeartbeatEventData[] = [];
    channel.addListener('al_heartbeat_event', (event) =>
      heartbeats.push(event)
    );
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeAppLifecycle(fake),
        reactNativeHeartbeat({
          heartbeatInterval: 100,
          maxUserInactivityDuration: 150,
        }),
        reactNativeUIEvents(),
      ],
    });
    function Pressable(props: { onPress(): void }) {
      return React.createElement('pressable', props);
    }
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        jsx(Pressable, { onPress: () => undefined })
      );
    });
    if (renderer == null) throw new Error('Expected a mounted renderer.');
    const mountedRenderer = renderer;

    jest.advanceTimersByTime(200);
    expect(heartbeats.map((event) => event.heartbeatType)).toEqual([
      ALHeartbeatType.START,
      ALHeartbeatType.SCHEDULED,
    ]);
    mountedRenderer.root.findByType('pressable').props.onPress();
    jest.advanceTimersByTime(100);
    expect(heartbeats.at(-1)?.heartbeatType).toBe(ALHeartbeatType.SCHEDULED);
    expect(heartbeats).toHaveLength(3);
    act(() => mountedRenderer.unmount());
  });

  test('keeps repeated initialization idempotent', () => {
    const first = createFakeLifecycle('active');
    const second = createFakeLifecycle('active');
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({
      channel,
      plugins: [reactNativeAppLifecycle(first)],
    });
    expect(
      AutoLogging.init({
        channel,
        plugins: [reactNativeAppLifecycle(second)],
      })
    ).toBe(false);
    expect(first.AppState.addListenerCalls).toBe(1);
    expect(second.AppState.addListenerCalls).toBe(0);
  });
});
