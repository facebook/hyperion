/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { ResilientChannel } from 'hyperion-channel/src/ResilientChannel';
import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import { createAutoLoggingChannel } from '../src/ALChannel';

interface TestEvents extends BaseChannelEventType {
  event: [value: number];
}

describe('AutoLoggingChannel', () => {
  test('creates an application-owned resilient channel', () => {
    const errors: unknown[] = [];
    const channel = createAutoLoggingChannel<TestEvents>((error) =>
      errors.push(error)
    );
    const laterListener = jest.fn();
    channel.addListener('event', () => {
      throw new Error('subscriber failure');
    });
    channel.addListener('event', laterListener);

    expect(channel).toBeInstanceOf(ResilientChannel);
    expect(() => channel.emit('event', 42)).not.toThrow();
    expect(laterListener).toHaveBeenCalledWith(42);
    expect(errors).toHaveLength(1);
  });
});
