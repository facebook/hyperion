/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import TestAndSet from '../src/TestAndSet';


describe('test and set', () => {
  it('test and set', () => {
    const flag = new TestAndSet();
    expect(flag.testAndSet()).toBe(false);
    expect(flag.testAndSet()).toBe(true);
  });
});
