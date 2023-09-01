/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { TimedTrigger } from '../src/TimedTrigger';

describe("timed trigger", () => {
  /**
   * There seems to be change in node v19 that prevents fake timers
   * to work. I keep the commented code needed for running with fake timers
   * but for now use async tests to continue having poroper tests.
   */

  test('call once', () => {
    let count = 0;
    const f = new TimedTrigger(() => {
      count++;
    }, 100);

    f.run();
    f.run();

    expect(f.isDone()).toBe(true);
    expect(count).toBe(1);
  });

  test('call timeout', (done) => {
    jest.useFakeTimers();

    let count = 0;
    const f1 = new TimedTrigger(() => {
      count++;

    }, 10);

    const f2 = new TimedTrigger(() => {
      // by now the other timer must have run
      expect(f1.isDone()).toBe(true);
      expect(count).toBe(1);
      done();
    }, 100);

    jest.runAllTimers();
    expect(f1.isDone()).toBe(true);
    expect(f2.isDone()).toBe(true);
    expect(count).toBe(1);
  });

  test('cancelling', (done) => {
    jest.useFakeTimers();

    let count = 0;
    const f1 = new TimedTrigger(() => {
      count++;
    }, 10);
    f1.cancel();

    const f2 = new TimedTrigger(() => {
      // by now the other timer must have run
      expect(f1.isDone()).toBe(false);
      expect(f1.isCancelled()).toBe(true);
      expect(count).toBe(0);
      done();
    }, 100);

    jest.runAllTimers();
    expect(f1.isDone()).toBe(false);
    expect(f1.isCancelled()).toBe(true);
    expect(count).toBe(0);
    expect(f2.isDone()).toBe(true);

  });

  test('call idle callback', (done) => {
    jest.useFakeTimers();

    let count = 0;
    const f1 = new TimedTrigger(() => {
      count++;
    }, 10, true);

    const f2 = new TimedTrigger(() => {
      // by now the other timer must have run
      expect(f1.isDone()).toBe(true);
      expect(count).toBe(1);
      done();
    }, 100, true);

    jest.runAllTimers();
    expect(f1.isDone()).toBe(true);
    expect(f2.isDone()).toBe(true);
    expect(count).toBe(1);
  });
  // jest.useRealTimers();
});
