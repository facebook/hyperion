/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";


describe('Test interception via test. ', () => {

  test('Check global this interception during test', async () => {
    /**
     * We use timers because we know they will internally use setTimeout
     * and other timer related api that we have intercepted.
     */
    jest.useFakeTimers();

    console.log('BEFORE FIRST');
    jest.advanceTimersByTime(100);
    console.log('AFTER FIRST');

    /**
     * We load the following here to test what happens if jest starts first
     * and then we install the interceptors.
     * Goal is to see everyting continue to function correctly.
     */
    const x = require("../src/IGlobalThis");
    x.setTimeout.onBeforeCallArgsObserverAdd(() => {
      console.log("something");
    });

    console.log('BEFORE SECOND');
    let y: number = 0;
    setTimeout(() => {
      y = 1;
    }, 50);

    jest.advanceTimersByTime(100);
    console.log('AFTER SECOND');
    expect(y).toBe(1);
  });

});