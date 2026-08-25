/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { Channel } from '../src/Channel';
import {
  ResilientChannel,
  ResilientPausableChannel,
} from '../src/ResilientChannel';

interface ChannelEvents {
  ev1: [];
}

describe('ResilientChannel', () => {
  test('isolates listeners and downstream channels', () => {
    const errors: unknown[] = [];
    const channel1 = new ResilientChannel<ChannelEvents>((error) =>
      errors.push(error)
    );
    const channel2 = new ResilientChannel<ChannelEvents>((error) =>
      errors.push(error)
    );
    const calls: string[] = [];
    channel1.addListener('ev1', () => {
      calls.push('first');
      throw new Error('listener failure');
    });
    channel1.addListener('ev1', () => calls.push('second'));
    channel2.addListener('ev1', () => {
      calls.push('downstream first');
      throw new Error('downstream failure');
    });
    channel2.addListener('ev1', () => calls.push('downstream second'));
    channel1.pipe(channel2);

    expect(() => channel1.emit('ev1')).not.toThrow();
    expect(calls).toEqual([
      'first',
      'second',
      'downstream first',
      'downstream second',
    ]);
    expect(errors).toHaveLength(2);
  });

  test('isolates strict downstream failures and supports unpipe', () => {
    const errors: unknown[] = [];
    const channel = new ResilientChannel<ChannelEvents>((error) =>
      errors.push(error)
    );
    const failingChannel = new Channel<ChannelEvents>();
    const laterChannel = new Channel<ChannelEvents>();
    const failingLaterListener = jest.fn();
    const laterChannelListener = jest.fn();
    failingChannel.addListener('ev1', () => {
      throw new Error('downstream failure');
    });
    failingChannel.addListener('ev1', failingLaterListener);
    laterChannel.addListener('ev1', laterChannelListener);
    channel.pipe(failingChannel, (task) => task());
    channel.pipe(laterChannel);

    expect(() => channel.emit('ev1')).not.toThrow();
    expect(failingLaterListener).not.toHaveBeenCalled();
    expect(laterChannelListener).toHaveBeenCalledTimes(1);
    expect(errors).toHaveLength(1);
    expect(channel.unpipe(failingChannel)).toBe(true);
    expect(channel.unpipe(laterChannel)).toBe(true);
  });

  test('preserves removal and addition during dispatch', () => {
    const channel = new ResilientChannel<ChannelEvents>();
    const calls: string[] = [];
    const removed = () => calls.push('removed');
    const added = () => calls.push('added');
    let changed = false;
    channel.addListener('ev1', () => {
      calls.push('first');
      if (!changed) {
        changed = true;
        channel.removeListener('ev1', removed);
        channel.addListener('ev1', added);
      }
    });
    channel.addListener('ev1', removed);

    channel.emit('ev1');
    expect(calls).toEqual(['first', 'removed']);
    calls.length = 0;
    channel.emit('ev1');
    expect(calls).toEqual(['first', 'added']);
  });

  test('suppresses local and downstream dispatch while paused', () => {
    const channel1 = new ResilientPausableChannel<ChannelEvents>();
    const channel2 = new ResilientChannel<ChannelEvents>();
    const localListener = jest.fn();
    const downstreamListener = jest.fn();
    channel1.addListener('ev1', localListener);
    channel2.addListener('ev1', downstreamListener);
    channel1.pipe(channel2);

    channel1.pause();
    channel1.emit('ev1');
    expect(localListener).not.toHaveBeenCalled();
    expect(downstreamListener).not.toHaveBeenCalled();

    channel1.unpause();
    channel1.emit('ev1');
    expect(localListener).toHaveBeenCalledTimes(1);
    expect(downstreamListener).toHaveBeenCalledTimes(1);
  });
});
