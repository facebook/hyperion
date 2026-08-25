/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { Channel } from 'hyperion-channel/src/Channel';
import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import {
  initializePluginsStrictly,
  type ALChannelPluginInit,
} from '../src/ALPlugin';

interface TestEvents extends BaseChannelEventType {
  event: [value: number];
}

describe('strict AutoLogging plugin initialization', () => {
  test('runs channel-only plugins in order with exactly one argument', () => {
    const channel = new Channel<TestEvents>();
    const calls: string[] = [];
    const start = jest.fn();
    const dispose = jest.fn();
    const first: ALChannelPluginInit<TestEvents> = function (
      ...args: [Channel<TestEvents>]
    ) {
      const [receivedChannel] = args;
      expect(receivedChannel).toBe(channel);
      expect(args).toHaveLength(1);
      calls.push('first');
      return { start, dispose };
    };
    const second: ALChannelPluginInit<TestEvents> = () => {
      calls.push('second');
    };

    initializePluginsStrictly(channel, [first, null, undefined, second]);

    expect(calls).toEqual(['first', 'second']);
    expect(start).not.toHaveBeenCalled();
    expect(dispose).not.toHaveBeenCalled();
  });

  test('preserves strict failure and partial-initialization behavior', () => {
    const channel = new Channel<TestEvents>();
    const calls: string[] = [];
    const failure = new Error('plugin failure');

    expect(() =>
      initializePluginsStrictly(channel, [
        () => {
          calls.push('first');
        },
        () => {
          calls.push('failing');
          throw failure;
        },
        () => {
          calls.push('last');
        },
      ])
    ).toThrow(failure);
    expect(calls).toEqual(['first', 'failing']);
  });

  test('uses Array.forEach mutation semantics', () => {
    const channel = new Channel<TestEvents>();
    const calls: string[] = [];
    const appended = () => {
      calls.push('appended');
    };
    const plugins: ALChannelPluginInit<TestEvents>[] = [
      () => {
        calls.push('first');
        plugins.push(appended);
      },
    ];

    initializePluginsStrictly(channel, plugins);

    expect(calls).toEqual(['first']);
  });
});
