/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { createAutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type { ALReactNativePlugin } from '../src/ALRuntime';
import type { ALReactNativeEventMap } from '../src/ALTypes';
import * as AutoLogging from '../src/AutoLogging';

describe('React Native plugin runtime', () => {
  afterEach(() => AutoLogging.dispose());

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
});
