/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { createALEventFactory } from '../src/ALEventFactory';

describe('ALEventFactory', () => {
  test('creates contiguous events from injected providers', () => {
    const now = jest.fn(() => 1234);
    let nextIndex = 0;
    const baseMetadata = { app: 'test', shared: 'base' };
    const eventMetadata = { feature: 'button', shared: 'event' };
    const factory = createALEventFactory({
      now,
      nextEventIndex: () => nextIndex++,
      getBaseMetadata: () => baseMetadata,
    });

    expect(factory.createEvent({ metadata: eventMetadata })).toEqual({
      eventTimestamp: 1234,
      eventIndex: 0,
      metadata: {
        app: 'test',
        feature: 'button',
        shared: 'event',
      },
    });
    expect(factory.createEvent()).toEqual({
      eventTimestamp: 1234,
      eventIndex: 1,
      metadata: {
        app: 'test',
        shared: 'base',
      },
    });
    expect(baseMetadata).toEqual({ app: 'test', shared: 'base' });
    expect(eventMetadata).toEqual({ feature: 'button', shared: 'event' });
    expect(now).toHaveBeenCalledTimes(2);
  });

  test('uses explicit timestamps and includes only supplied relationships', () => {
    const now = jest.fn(() => 9999);
    let nextIndex = 7;
    const factory = createALEventFactory({
      now,
      nextEventIndex: () => nextIndex++,
      getBaseMetadata: () => ({}),
    });

    const unrelated = factory.createEvent({ eventTimestamp: 1000 });
    const related = factory.createEvent({
      eventTimestamp: 1001,
      relatedEventIndex: 0,
    });

    expect(unrelated).toEqual({
      eventTimestamp: 1000,
      eventIndex: 7,
      metadata: {},
    });
    expect('relatedEventIndex' in unrelated).toBe(false);
    expect(related).toEqual({
      eventTimestamp: 1001,
      eventIndex: 8,
      metadata: {},
      relatedEventIndex: 0,
    });
    expect(now).not.toHaveBeenCalled();
  });

  test('does not consume an index when metadata construction fails', () => {
    const nextEventIndex = jest.fn(() => 0);
    const metadata = Object.defineProperty({}, 'failure', {
      enumerable: true,
      get() {
        throw new Error('metadata failure');
      },
    });
    const factory = createALEventFactory({
      now: () => 1234,
      nextEventIndex,
      getBaseMetadata: () => metadata,
    });

    expect(() => factory.createEvent()).toThrow('metadata failure');
    expect(nextEventIndex).not.toHaveBeenCalled();
  });

  test('does not consume an index when relationship lookup fails', () => {
    const nextEventIndex = jest.fn(() => 0);
    const factory = createALEventFactory({
      now: () => 1234,
      nextEventIndex,
      getBaseMetadata: () => ({}),
    });
    const options = Object.defineProperty({}, 'relatedEventIndex', {
      get() {
        throw new Error('relationship failure');
      },
    });

    expect(() => factory.createEvent(options)).toThrow('relationship failure');
    expect(nextEventIndex).not.toHaveBeenCalled();
  });
});
