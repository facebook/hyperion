/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
  * @jest-environment jsdom
 */

import "jest";

import performanceAbsoluteNow from "../src/performanceAbsoluteNow";

describe('test performance now', () => {
  test('test absolute avalue', () => {
    const t1 = performanceAbsoluteNow();
    const t2 = performance.now() + performance.timeOrigin;
    expect(Math.abs(t1 - t2)).toBeLessThan(1);
  });

  test('test from relative time', () => {
    const t1 = performanceAbsoluteNow();
    const t2 = performance.now();
    const t3 = performanceAbsoluteNow.fromRelativeTime(t2);

    expect(Math.abs(t1 - t3)).toBeLessThan(1);
  });

});