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
});
