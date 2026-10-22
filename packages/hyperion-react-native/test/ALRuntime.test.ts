/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type {
  ALReactNativePlugin,
  ALReactNativeRuntimeContext,
} from '../src/ALRuntime';
import type { ALReactNativeEventMap } from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';

function initializeSession(
  sessionTimeoutMs?: number
): ALReactNativeRuntimeContext {
  const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
  let capturedContext: ALReactNativeRuntimeContext | null = null;
  AutoLogging.init({
    channel,
    plugins: [
      {
        name: 'session-probe',
        install(_channel, context) {
          capturedContext = context;
        },
      },
    ],
    sessionTimeoutMs,
  });
  if (capturedContext == null) {
    throw new Error('Expected the runtime context to be installed.');
  }
  return capturedContext;
}

describe('React Native plugin runtime', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });
  });

  afterEach(() => {
    AutoLogging.dispose();
    jest.useRealTimers();
  });

  test('uses the application channel and starts only after every install', () => {
    const calls: string[] = [];
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const plugin = (
      name: string
    ): ALReactNativePlugin<ALReactNativeEventMap> => ({
      name,
      install(installedChannel) {
        calls.push(`install:${name}`);
        expect(installedChannel).toBe(channel);
        return {
          start: () => calls.push(`start:${name}`),
          dispose: () => calls.push(`dispose:${name}`),
        };
      },
    });

    expect(
      AutoLogging.init({
        channel,
        plugins: [plugin('first'), plugin('second')],
      })
    ).toBe(true);
    expect(calls).toEqual([
      'install:first',
      'install:second',
      'start:first',
      'start:second',
    ]);
    expect(AutoLogging.isInitialized()).toBe(true);
    expect(AutoLogging.init({ channel, plugins: [] })).toBe(false);
    expect(AutoLogging.dispose()).toBe(true);
    expect(calls.slice(-2)).toEqual(['dispose:second', 'dispose:first']);
  });

  test('rolls back failures and permits a corrected retry', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const dispose = jest.fn();
    const failure = new Error('installation failed');

    expect(() =>
      AutoLogging.init({
        channel,
        plugins: [
          { name: 'first', install: () => ({ dispose }) },
          {
            name: 'failure',
            install() {
              throw failure;
            },
          },
        ],
      })
    ).toThrow(failure);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(AutoLogging.isInitialized()).toBe(false);
    expect(AutoLogging.init({ channel, plugins: [] })).toBe(true);
  });

  test('creates contiguous events through one runtime event factory', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    const indexes: number[] = [];

    AutoLogging.init({
      channel,
      plugins: [
        {
          name: 'events',
          install(_channel, context) {
            indexes.push(context.eventFactory.createEvent().eventIndex);
            return {
              start() {
                indexes.push(context.eventFactory.createEvent().eventIndex);
              },
            };
          },
        },
      ],
    });

    expect(indexes).toEqual([0, 1]);
  });

  test('does not get stuck when a plugin re-enters initialization', () => {
    const channel = createAutoLoggingChannel<ALReactNativeEventMap>();
    let nestedResult: boolean | undefined;
    AutoLogging.init({
      channel,
      plugins: [
        {
          name: 'reentrant',
          install() {
            nestedResult = AutoLogging.init({ channel, plugins: [] });
          },
        },
      ],
    });
    expect(nestedResult).toBe(false);
    expect(AutoLogging.isInitialized()).toBe(true);
  });

  test('keeps the default session timeout at thirty minutes', () => {
    const context = initializeSession();
    const start = Date.now();
    const initialSessionId = context.session.getSessionId();

    jest.setSystemTime(start + 29 * 60_000);
    expect(context.session.getSessionId()).toBe(initialSessionId);
    jest.setSystemTime(start + 31 * 60_000);
    context.session.recordActivity();
    expect(context.session.getSessionId()).not.toBe(initialSessionId);
  });

  test('rotates a custom-timeout session only on activity', () => {
    const context = initializeSession(60_000);
    const start = Date.now();
    const initialSessionId = context.session.getSessionId();

    expect(
      context.eventFactory.createEvent({ eventTimestamp: start }).eventIndex
    ).toBe(0);
    context.session.recordActivity(start + 59_000);
    expect(context.session.getSessionId()).toBe(initialSessionId);
    expect(
      context.eventFactory.createEvent({ eventTimestamp: start + 120_001 })
        .eventIndex
    ).toBe(1);
    expect(context.session.getSessionId()).toBe(initialSessionId);

    context.session.recordActivity(start + 120_001);
    expect(context.session.getSessionId()).not.toBe(initialSessionId);
    expect(
      context.eventFactory.createEvent({ eventTimestamp: start + 120_001 })
        .eventIndex
    ).toBe(0);
  });

  test('keeps non-activity events in the current session at the timeout boundary', () => {
    const context = initializeSession(60_000);
    const start = Date.now();
    const initialSessionId = context.session.getSessionId();

    const boundaryEvent = context.eventFactory.createEvent({
      eventTimestamp: start + 60_000,
    });
    jest.setSystemTime(start + 60_001);

    expect(boundaryEvent.eventIndex).toBe(0);
    expect(context.session.getSessionId()).toBe(initialSessionId);
    expect(context.eventFactory.createEvent().eventIndex).toBe(1);
  });

  test.each([0, -1, Number.NaN])(
    'uses the default session timeout for invalid value %s',
    (sessionTimeoutMs) => {
      const context = initializeSession(sessionTimeoutMs);
      const start = Date.now();
      const initialSessionId = context.session.getSessionId();

      context.session.recordActivity(start + 29 * 60_000);
      expect(context.session.getSessionId()).toBe(initialSessionId);
      context.session.recordActivity(start + 60 * 60_000);
      expect(context.session.getSessionId()).not.toBe(initialSessionId);
      AutoLogging.dispose();
    }
  );
});
