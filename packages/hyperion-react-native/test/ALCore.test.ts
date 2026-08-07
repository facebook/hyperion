/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as AutoLogging from '../src/AutoLogging';
import { logAppEvent } from '../src/ALAppEvent';
import { addChannelSubscriber } from '../src/ALChannel';
import {
  createLoggableEvent,
  createTransportEnvelope,
} from '../src/ALContract';
import {
  ALHeartbeatType,
  resetHeartbeatEnvironmentForTests,
  setHeartbeatEnvironmentForTests,
  startHeartbeat,
  stopHeartbeat,
  type ALHeartbeatEnvironment,
} from '../src/ALHeartbeat';
import {
  extractElementInfo,
  extractElementText,
  extractEventValue,
} from '../src/ALLabelExtraction';
import { mergeMetadata } from '../src/ALMetadata';
import {
  getALRuntimeConfig,
  initializeAutoLogging,
  isALRuntimeEnabled,
  resetALRuntimeForTests,
} from '../src/ALRuntime';
import { getCurrentScreen, setCurrentScreen } from '../src/ALScreen';
import {
  extendSession,
  getAppInstanceId,
  getScreenId,
  getSessionId,
  resetSessionForTests,
} from '../src/ALSession';
import type {
  ALAppStateEventData,
  ALCustomEventData,
  ALHeartbeatEventData,
  ALScreenTransitionEventData,
} from '../src/ALTypes';

jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: () => ({ remove: () => undefined }),
  },
}));

interface FakeEnvironment extends ALHeartbeatEnvironment {
  advance(milliseconds: number): void;
  transition(state: string): void;
  fireInterval(): void;
  readonly listenerCount: number;
  readonly intervalCount: number;
}

function createFakeEnvironment(): FakeEnvironment {
  let now = 1_700_000_000_000;
  let state = 'active';
  let listener: ((state: string) => void) | null = null;
  const intervals = new Map<number, () => void>();
  let nextHandle = 1;
  return {
    now: () => now,
    getCurrentState: () => state,
    addStateListener(callback) {
      listener = callback;
      return { remove: () => (listener = null) };
    },
    setInterval(callback) {
      const handle = nextHandle++;
      intervals.set(handle, callback);
      return handle as unknown as ReturnType<typeof setInterval>;
    },
    clearInterval(handle) {
      intervals.delete(handle as unknown as number);
    },
    advance(milliseconds) {
      now += milliseconds;
    },
    transition(nextState) {
      state = nextState;
      listener?.(nextState);
    },
    fireInterval() {
      for (const callback of [...intervals.values()]) callback();
    },
    get listenerCount() {
      return listener == null ? 0 : 1;
    },
    get intervalCount() {
      return intervals.size;
    },
  };
}

describe('raw data extraction and provenance', () => {
  it('preserves scalar metadata without applying product policy', () => {
    const metadata = mergeMetadata({
      password_hint: 'private',
      authToken: 'private',
      invalid: Number.POSITIVE_INFINITY,
      nested: { retainedBySubscriber: true },
    });
    expect(metadata).toEqual({
      password_hint: 'private',
      authToken: 'private',
      invalid: Number.POSITIVE_INFINITY,
    });
  });

  it('identifies application text and developer identifiers', () => {
    expect(
      extractElementText(
        extractElementInfo('Button', {
          accessibilityLabel: 'Account 1234',
          testID: 'save-button',
        })
      )
    ).toEqual({
      text: 'Account 1234',
      source: 'accessibilityLabel',
      sourceType: 'application_text',
      potentiallySensitive: true,
    });
    expect(
      extractElementText(
        extractElementInfo('Button', {
          testID: 'save-button',
        })
      )
    ).toEqual({
      text: 'save-button',
      source: 'testID',
      sourceType: 'developer_identifier',
      potentiallySensitive: false,
    });
  });

  it('captures raw input values with subscriber-facing provenance', () => {
    const info = extractElementInfo('TextInput', {
      placeholder: 'Email',
      value: 'person@example.com',
    });
    expect(extractElementText(info)).toEqual({
      text: 'Email',
      source: 'placeholder',
      sourceType: 'application_text',
      potentiallySensitive: true,
    });
    expect(extractEventValue('onChangeText', ['secret text'], info)).toEqual({
      value: 'secret text',
      source: 'callback_argument',
      sourceType: 'user_input',
      potentiallySensitive: true,
    });
    expect(extractEventValue('onBlur', [], info)).toEqual({
      value: 'person@example.com',
      source: 'element_value_prop',
      sourceType: 'user_input',
      potentiallySensitive: true,
    });
    expect(extractEventValue('onValueChange', ['account-1234'], info)).toEqual({
      value: 'account-1234',
      source: 'callback_argument',
      sourceType: 'control_value',
      potentiallySensitive: true,
    });
  });
});

describe('sessions, screens, and core publishers', () => {
  beforeEach(() => {
    resetSessionForTests();
  });

  afterEach(() => {
    resetALRuntimeForTests();
  });

  it('assigns contiguous indexes and keeps deployment context in an envelope', () => {
    const custom: ALCustomEventData[] = [];
    const screens: ALScreenTransitionEventData[] = [];
    addChannelSubscriber('al_custom_event', (event) => custom.push(event));
    addChannelSubscriber('al_screen_transition_event', (event) =>
      screens.push(event)
    );
    initializeAutoLogging({ appName: 'sample_app', heartbeatInterval: false });

    logAppEvent('settings.open', { source: 'button' });
    const previousScreenId = getScreenId();
    expect(setCurrentScreen('Settings', { route_name: 'settings' })).toBe(true);
    expect(setCurrentScreen('Settings')).toBe(false);
    logAppEvent('settings.save.success');

    const events = [custom[0], screens[0], custom[1]];
    expect(events.map((event) => event.eventIndex)).toEqual([0, 1, 2]);
    expect(
      events.every((event) => event.eventTimestamp > 1_000_000_000_000)
    ).toBe(true);
    expect(getCurrentScreen()?.name).toBe('Settings');
    expect(getScreenId()).not.toBe(previousScreenId);
    expect(getSessionId()).toMatch(/^[0-9a-z]{6}$/);
    expect(getAppInstanceId()).toMatch(/^[0-9a-z]{6}$/);

    const envelope = createTransportEnvelope('custom', custom[0], 'sample_app');
    expect(custom[0]).not.toHaveProperty('appName');
    expect(envelope.context).toEqual(
      expect.objectContaining({
        appName: 'sample_app',
        sessionId: getSessionId(),
        screen: 'Settings',
      })
    );
  });

  it('rejects invalid custom event names', () => {
    const events: ALCustomEventData[] = [];
    addChannelSubscriber('al_custom_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    logAppEvent('Invalid Event', { safe: true });
    logAppEvent('one_segment', { safe: true });
    expect(events).toHaveLength(0);
  });

  it('preserves explicit attributes for subscriber-owned policy', () => {
    const events: ALCustomEventData[] = [];
    addChannelSubscriber('al_custom_event', (event) => events.push(event));
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
    const longValue = 'x'.repeat(400);

    logAppEvent('fixture.metadata', {
      contactEmail: 'person@example.com',
      count: 2,
      enabled: true,
      nullable: null,
      longValue,
      nested: { unsupported: true },
    });

    expect(events[0].attributes).toEqual({
      contactEmail: 'person@example.com',
      count: 2,
      enabled: true,
      nullable: null,
      longValue,
      nested: { unsupported: true },
    });
    expect(events[0].metadata).toEqual({
      contactEmail: 'person@example.com',
      count: 2,
      enabled: true,
      nullable: null,
      longValue,
      level: 'info',
    });
  });

  it('rotates expired sessions and restarts the contiguous event index', () => {
    const start = 1_700_000_000_000;
    extendSession(start);
    const firstSession = getSessionId(start);
    expect(createLoggableEvent(start + 1).eventIndex).toBe(0);
    expect(createLoggableEvent(start + 2).eventIndex).toBe(1);

    const afterTimeout = start + 30 * 60 * 1_000 + 1;
    const nextSession = getSessionId(afterTimeout);
    expect(nextSession).not.toBe(firstSession);
    expect(createLoggableEvent(afterTimeout + 1).eventIndex).toBe(0);
  });

  it('initializes one runtime and one request-to-public publisher set', () => {
    const events: ALCustomEventData[] = [];
    addChannelSubscriber('al_custom_event', (event) => events.push(event));
    const first = initializeAutoLogging({
      appName: 'test',
      heartbeatInterval: false,
    });
    const second = initializeAutoLogging({
      appName: 'ignored_second_initialization',
      heartbeatInterval: false,
    });

    expect(second).toBe(first);
    logAppEvent('runtime.idempotent');
    expect(events).toHaveLength(1);
  });

  it('does no heartbeat or publisher work when disabled', () => {
    const environment = createFakeEnvironment();
    setHeartbeatEnvironmentForTests(environment);
    AutoLogging.init({ appName: 'test', enabled: false });
    expect(isALRuntimeEnabled()).toBe(false);
    expect(environment.listenerCount).toBe(0);
    expect(environment.intervalCount).toBe(0);
    logAppEvent('disabled.event');
  });

  it('accepts the complete runtime config through AutoLogging.init', () => {
    const componentNameValidator = (name: string) => name !== 'Ignored';
    AutoLogging.init({
      appName: 'configured_app',
      enabled: true,
      heartbeatInterval: false,
      maxUserInactivityDuration: 1234,
      debug: true,
      interceptProps: ['onMagic'],
      componentNameValidator,
      features: { automaticUIEvents: false, customEvents: true },
      react: { enableInterceptComponentElement: false },
      props: { enableInterceptReactComponentProp: false },
    });

    expect(getALRuntimeConfig()).toEqual({
      appName: 'configured_app',
      enabled: true,
      heartbeatInterval: false,
      maxUserInactivityDuration: 1234,
      debug: true,
      interceptProps: ['onMagic'],
      componentNameValidator,
      features: { automaticUIEvents: false, customEvents: true },
    });
  });

  it('preserves disabled legacy interception gates when enabled is omitted', () => {
    AutoLogging.init({
      appName: 'legacy_disabled',
      heartbeat: false,
      react: { enableInterceptComponentElement: false },
      props: null,
    });

    expect(isALRuntimeEnabled()).toBe(false);
  });

  it('can disable screen-transition publishing without disabling screen state', () => {
    const screens: ALScreenTransitionEventData[] = [];
    addChannelSubscriber('al_screen_transition_event', (event) =>
      screens.push(event)
    );
    AutoLogging.init({
      appName: 'screen_state_only',
      heartbeat: false,
      features: { screenTransitionEvents: false },
    });

    expect(setCurrentScreen('Settings')).toBe(true);
    expect(getCurrentScreen()?.name).toBe('Settings');
    expect(screens).toHaveLength(0);
  });

  it('allows enabled to disable work independently of legacy gates', () => {
    const environment = createFakeEnvironment();
    setHeartbeatEnvironmentForTests(environment);
    AutoLogging.init({
      appName: 'disabled_app',
      enabled: false,
      react: { enableInterceptComponentElement: true },
      props: { enableInterceptReactComponentProp: true },
    });

    expect(isALRuntimeEnabled()).toBe(false);
    expect(environment.listenerCount).toBe(0);
    expect(environment.intervalCount).toBe(0);
  });
});

describe('heartbeat lifecycle', () => {
  let environment: FakeEnvironment;
  let heartbeats: ALHeartbeatEventData[];
  let appStates: ALAppStateEventData[];

  beforeEach(() => {
    environment = createFakeEnvironment();
    setHeartbeatEnvironmentForTests(environment);
    heartbeats = [];
    appStates = [];
    addChannelSubscriber('al_heartbeat_event', (event) =>
      heartbeats.push(event)
    );
    addChannelSubscriber('al_app_state_event', (event) =>
      appStates.push(event)
    );
    initializeAutoLogging({ appName: 'test', heartbeatInterval: false });
  });

  afterEach(() => {
    resetALRuntimeForTests();
    resetHeartbeatEnvironmentForTests();
  });

  it('emits lifecycle transitions with one listener and interval', () => {
    startHeartbeat(100, 400);
    startHeartbeat(100, 400);
    expect(environment.listenerCount).toBe(1);
    expect(environment.intervalCount).toBe(1);
    expect(heartbeats.map((event) => event.heartbeatType)).toEqual([
      ALHeartbeatType.START,
    ]);

    environment.advance(100);
    environment.fireInterval();
    environment.advance(10);
    environment.transition('background');
    expect(environment.intervalCount).toBe(0);
    environment.advance(50);
    environment.transition('active');
    expect(environment.intervalCount).toBe(1);
    environment.advance(150);
    environment.transition('background');
    environment.advance(150);
    environment.transition('active');

    expect(heartbeats.map((event) => event.heartbeatType)).toEqual([
      ALHeartbeatType.START,
      ALHeartbeatType.SCHEDULED,
      ALHeartbeatType.PAGE_FOCUS_LOST,
      ALHeartbeatType.PAGE_FOCUS_GAINED,
      ALHeartbeatType.PAGE_FOCUS_LOST,
      ALHeartbeatType.REGAIN_PAGE_VISIBILITY,
    ]);
    expect(appStates.map((event) => event.appState)).toEqual([
      'background',
      'active',
      'background',
      'active',
    ]);

    stopHeartbeat();
    expect(heartbeats.at(-1)?.heartbeatType).toBe(ALHeartbeatType.STOP);
    expect(environment.listenerCount).toBe(0);
    expect(environment.intervalCount).toBe(0);
  });

  it('suppresses scheduled heartbeat after maximum inactivity', () => {
    startHeartbeat(100, 200);
    environment.advance(201);
    environment.fireInterval();
    expect(heartbeats.map((event) => event.heartbeatType)).toEqual([
      ALHeartbeatType.START,
    ]);
  });

  it('keeps application subscribers isolated from lifecycle control', () => {
    addChannelSubscriber('al_heartbeat_event', () => {
      throw new Error('product listener failure');
    });
    startHeartbeat(100, 400);
    expect(() => environment.fireInterval()).not.toThrow();
  });
});
