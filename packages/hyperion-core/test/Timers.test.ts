/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import "jest";


describe('test timers', () => {

  test('Check the rendered components', async () => {
    jest.useFakeTimers();

    console.log('BEFORE FIRST');
    jest.advanceTimersByTime(100);
    console.log('AFTER FIRST');

    /**
     * We load the following here to test what happens if jest starts first
     * and then we install the interceptors.
     * Goal is to see everyting continue function correctly.
     */
    const x = require("../src/IGlobalThis");
    x.setTimeout.onArgsObserverAdd(() => {
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