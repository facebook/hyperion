/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";
import { AsyncCounter } from "../src/AsyncCounter";

describe("test AsyncCounter", () => {

  test("test AsyncCounter count up", async () => {
    const counter = new AsyncCounter(5);
    const trigger = jest.fn(() => {
      counter.countUp();
    })
    const id = setInterval(trigger, 100);

    const finalCount = await counter.reachTarget();
    clearInterval(id);

    expect(trigger).toBeCalledTimes(finalCount);
  });

  test("test AsyncCounter count down & up", async () => {
    const counter = new AsyncCounter(5);
    const trigger = jest.fn(() => {
      counter.countUp();
    })
    const id = setInterval(trigger, 100);

    counter.countDown().countDown(4);
    expect(counter.getCount()).toBe(-5);
    expect(counter.getSteps()).toBe(2);

    const finalCount = await counter.reachTarget();
    clearInterval(id);

    expect(counter.getCount()).toBe(finalCount);
    expect(counter.getSteps()).toBe(2 + finalCount + 5);
    expect(trigger).toBeCalledTimes(finalCount + 5);
  });
  test('should resolve the promise when the counter reaches the target count', async () => {
    // Arrange: Create an instance of AsyncCounter with a target of 3.
    const target = 3;
    const counter = new AsyncCounter(target);

    // Act: Increment the counter in separate steps.
    const promise = counter.reachTarget();
    
    counter.countUp(); // count = 1
    counter.countUp(); // count = 2
    counter.countUp(); // count = 3

    // Assert: The promise should now be resolved.
    // Use `await` to wait for the promise to settle.
    await expect(promise).resolves.toBe(target);
  });

  test('should not resolve the promise before the target count is reached', async () => {
    // Arrange: Create an instance with a target of 5.
    const target = 5;
    const counter = new AsyncCounter(target);

    // Act: Increment the counter but stop before the target.
    const promise = counter.reachTarget();
    
    counter.countUp(2); // count = 2
    counter.countUp(2); // count = 4

    // Assert: The promise should still be pending.
    // We can't directly check if a promise is "pending" without a race condition.
    // A better way is to use a promise that rejects after a short timeout if the main promise resolves.
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Promise should not have resolved')), 100);
    });

    // Use Promise.race to check that our target promise doesn't resolve before the timeout.
    await expect(Promise.race([promise, timeoutPromise])).rejects.toThrow('Promise should not have resolved');
  });

  test('should resolve even when the target is reached with a negative count', async () => {
    // Arrange: Set a negative target and count down.
    const target = -2;
    const counter = new AsyncCounter(target);

    // Act: Decrement the counter to reach the negative target.
    const promise = counter.reachTarget();
    
    counter.countDown(); // count = -1
    counter.countDown(); // count = -2

    // Assert: The promise should resolve with the negative target value.
    await expect(promise).resolves.toBe(target);
  });
});
