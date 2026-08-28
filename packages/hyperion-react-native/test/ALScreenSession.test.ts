/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type { ALReactNativePlugin } from '../src/ALRuntime';
import {
  getCurrentScreen,
  reactNativeScreens,
  setCurrentScreen,
} from '../src/ALScreen';
import {
  getAppInstanceId,
  getScreenId,
  getSessionId,
} from '../src/ALSessionPublic';
import { createTransportEnvelope } from '../src/ALTransport';
import type {
  ALReactNativeEventMap,
  ALScreenTransitionEventData,
} from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';

describe('React Native session and screen state', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });
  });

  afterEach(() => {
    AutoLogging.dispose();
    jest.useRealTimers();
  });

  test('publishes validated screen transitions and transport context', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALScreenTransitionEventData[] = [];
    channel.addListener('al_screen_transition_event', (event) =>
      events.push(event)
    );
    AutoLogging.init({ channel, plugins: [reactNativeScreens()] });
    const initialScreenId = getScreenId();

    expect(setCurrentScreen('', { ignored: true })).toBe(false);
    expect(
      setCurrentScreen('Settings', { route: 'settings', nested: {} as never })
    ).toBe(true);
    expect(setCurrentScreen('Settings')).toBe(false);
    expect(setCurrentScreen('Details')).toBe(true);

    expect(events.map((event) => event.eventIndex)).toEqual([0, 1]);
    expect(events[0]).toEqual(
      expect.objectContaining({
        event: 'screen_transition',
        metadata: { route: 'settings' },
        screen: 'Settings',
      })
    );
    expect(events[0]).not.toHaveProperty('previousScreen');
    expect(events[1]).toEqual(
      expect.objectContaining({
        previousScreen: 'Settings',
        previousScreenId: events[0].screenId,
        screen: 'Details',
      })
    );
    expect(getCurrentScreen()?.name).toBe('Details');
    expect(getScreenId()).not.toBe(initialScreenId);
    expect(getSessionId()).toMatch(/^[0-9a-z]{6}$/);
    expect(getAppInstanceId()).toMatch(/^[0-9a-z]{6}$/);

    const envelope = createTransportEnvelope(
      'al_screen_transition_event',
      events[0],
      'sample_app'
    );
    expect(events[0]).not.toHaveProperty('appName');
    expect(envelope.context).toEqual(
      expect.objectContaining({
        appName: 'sample_app',
        screen: 'Details',
        sessionId: getSessionId(),
      })
    );
  });

  test('resets contiguous indexes when the in-memory session expires', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const indexes: number[] = [];
    const timestamps = [
      1_700_000_000_000, 1_700_000_000_001, 1_700_001_800_002,
    ];
    const plugin: ALReactNativePlugin<ALReactNativeEventMap> = {
      name: 'session-probe',
      install(_channel, context) {
        for (const eventTimestamp of timestamps) {
          indexes.push(
            context.eventFactory.createEvent({ eventTimestamp }).eventIndex
          );
        }
      },
    };

    AutoLogging.init({ channel, plugins: [plugin] });
    expect(indexes).toEqual([0, 1, 0]);
  });

  test('allows later plugins to publish a screen during managed startup', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const events: ALScreenTransitionEventData[] = [];
    channel.addListener('al_screen_transition_event', (event) =>
      events.push(event)
    );
    AutoLogging.init({
      channel,
      plugins: [
        reactNativeScreens(),
        {
          name: 'initial-screen',
          dependencies: ['react-native-screens'],
          install() {
            return {
              start() {
                expect(setCurrentScreen('Initial')).toBe(true);
              },
            };
          },
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0].screen).toBe('Initial');
  });

  test('leaves screen APIs inactive when the plugin is absent or disposed', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    AutoLogging.init({ channel, plugins: [] });
    expect(setCurrentScreen('Inactive')).toBe(false);
    expect(getCurrentScreen()).toBeNull();
    expect(AutoLogging.dispose()).toBe(true);
    expect(() => getSessionId()).toThrow(
      'React Native AutoLogging is not initialized.'
    );
  });
});
