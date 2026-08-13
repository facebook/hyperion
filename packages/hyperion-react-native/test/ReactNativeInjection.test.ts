/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import {
  ALHeartbeatType,
  resetHeartbeatEnvironmentForTests,
} from '../src/ALHeartbeat';
import { getALRuntimeConfig, resetALRuntimeForTests } from '../src/ALRuntime';
import type { ALAppStateEventData, ALHeartbeatEventData } from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';
import type {
  AppStateStatus,
  ReactNativeAppState,
  ReactNativeModuleExports,
} from '../src/IReactNative';
import { createALTestChannel } from './ALTestChannel';

interface FakeAppState extends ReactNativeAppState {
  transition(state: AppStateStatus): void;
  readonly addListenerCalls: number;
  readonly currentStateReads: number;
  readonly removeCalls: number;
}

function createFakeReactNativeModule(initialState: AppStateStatus): {
  readonly module: ReactNativeModuleExports;
  readonly appState: FakeAppState;
  readonly moduleReads: number;
} {
  let state = initialState;
  let listener: ((state: AppStateStatus) => void) | null = null;
  let addListenerCalls = 0;
  let currentStateReads = 0;
  let moduleReads = 0;
  let removeCalls = 0;
  const appState: FakeAppState = {
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
  const module = {
    get AppState() {
      moduleReads++;
      return appState;
    },
  };
  return {
    module,
    appState,
    get moduleReads() {
      return moduleReads;
    },
  };
}

function createUnreadableReactNativeModule(): ReactNativeModuleExports {
  return Object.defineProperty({}, 'AppState', {
    get(): never {
      throw new Error('ReactNativeModule was accessed');
    },
  }) as ReactNativeModuleExports;
}

describe('injected React Native lifecycle environment', () => {
  let channel: ReturnType<typeof createALTestChannel>;

  beforeEach(() => {
    channel = createALTestChannel();
  });

  afterEach(() => {
    resetALRuntimeForTests();
    resetHeartbeatEnvironmentForTests();
    jest.useRealTimers();
  });

  it('imports the portable runtime without loading or mocking react-native', () => {
    expect(AutoLogging.init).toBeInstanceOf(Function);
  });

  it('does not access ReactNativeModule for disabled initialization', () => {
    expect(() =>
      AutoLogging.init({
        channel,
        appName: 'disabled',
        enabled: false,
        react: {
          ReactNativeModule: createUnreadableReactNativeModule(),
        },
      })
    ).not.toThrow();
  });

  it('does not access ReactNativeModule when no legacy family is enabled', () => {
    expect(() =>
      AutoLogging.init({
        channel,
        appName: 'legacy_disabled',
        react: {
          ReactNativeModule: createUnreadableReactNativeModule(),
          enableInterceptComponentElement: false,
        },
        props: null,
      })
    ).not.toThrow();
  });

  it('does not require an adapter when heartbeat is disabled', () => {
    expect(() =>
      AutoLogging.init({
        channel,
        appName: 'heartbeat_disabled',
        heartbeatInterval: false,
      })
    ).not.toThrow();
    expect(getALRuntimeConfig()?.heartbeatInterval).toBe(false);
  });

  it('fails clearly without an adapter when heartbeat is enabled', () => {
    expect(() =>
      AutoLogging.init({
        channel,
        appName: 'missing_adapter',
        heartbeatInterval: 100,
      })
    ).toThrow(
      'Heartbeat requires react.ReactNativeModule.AppState configuration'
    );
    expect(getALRuntimeConfig()).toBeNull();
  });

  it('uses injected AppState for lifecycle events and cleanup', () => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });
    const fake = createFakeReactNativeModule('active');
    const heartbeats: ALHeartbeatEventData[] = [];
    const appStates: ALAppStateEventData[] = [];
    channel.addListener('al_heartbeat_event', (event) =>
      heartbeats.push(event)
    );
    channel.addListener('al_app_state_event', (event) => appStates.push(event));

    AutoLogging.init({
      channel,
      appName: 'injected_app_state',
      heartbeatInterval: 100,
      maxUserInactivityDuration: 1_000,
      react: { ReactNativeModule: fake.module },
    });

    expect(fake.moduleReads).toBe(1);
    expect(fake.appState.currentStateReads).toBe(1);
    expect(fake.appState.addListenerCalls).toBe(1);
    expect(jest.getTimerCount()).toBe(1);

    jest.advanceTimersByTime(100);
    jest.advanceTimersByTime(10);
    fake.appState.transition('inactive');
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(10);
    fake.appState.transition('active');
    expect(jest.getTimerCount()).toBe(1);
    jest.advanceTimersByTime(10);
    fake.appState.transition('background');
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(100);
    fake.appState.transition('active');

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

    resetALRuntimeForTests();
    expect(fake.appState.removeCalls).toBe(1);
    expect(jest.getTimerCount()).toBe(0);
    expect(heartbeats.at(-1)?.heartbeatType).toBe(ALHeartbeatType.STOP);
  });

  it('does not read or subscribe again after initialization', () => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });
    const fake = createFakeReactNativeModule('active');
    AutoLogging.init({
      channel,
      appName: 'first',
      heartbeatInterval: 100,
      react: { ReactNativeModule: fake.module },
    });

    AutoLogging.init({
      channel: createALTestChannel(),
      appName: 'ignored',
      heartbeatInterval: 100,
      react: {
        ReactNativeModule: createUnreadableReactNativeModule(),
      },
    });

    expect(fake.moduleReads).toBe(1);
    expect(fake.appState.currentStateReads).toBe(1);
    expect(fake.appState.addListenerCalls).toBe(1);
    expect(jest.getTimerCount()).toBe(1);
  });
});
