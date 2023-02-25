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
  // jest.useFakeTimers();

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
    let count = 0;
    const f = new TimedTrigger(() => {
      count++;

    }, 10);

    new TimedTrigger(() => {
      // by now the other timer must have run
      expect(f.isDone()).toBe(true);
      expect(count).toBe(1);
      done();
    }, 100);

    // jest.runAllTimers();
    // expect(f.isDone()).toBe(true);
    // expect(count).toBe(1);
  });

  test('cancelling', (done) => {
    let count = 0;
    const f = new TimedTrigger(() => {
      count++;
    }, 10);
    f.cancel();

    new TimedTrigger(() => {
      // by now the other timer must have run
      expect(f.isDone()).toBe(false);
      expect(f.isCancelled()).toBe(true);
      expect(count).toBe(0);
      done();
    }, 100);

    // jest.runAllTimers();
    // expect(f.isDone()).toBe(false);
    // expect(f.isCancelled()).toBe(true);
    // expect(count).toBe(0);
  });

  // jest.useRealTimers();
});
