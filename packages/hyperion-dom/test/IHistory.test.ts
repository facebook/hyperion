/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IHistory from "../src/IHistory";

describe('test History interception', () => {
  test('test base History', () => {
    
    const pushState = jest.fn();
    IHistory.pushState.onBeforeCallObserverAdd(pushState);

    const forward = jest.fn();
    IHistory.forward.onBeforeCallObserverAdd(forward);

    const back = jest.fn();
    IHistory.back.onBeforeCallObserverAdd(back);

    const replaceState = jest.fn();
    IHistory.replaceState.onBeforeCallObserverAdd(replaceState);

    window.history.pushState(null, '', 'http://localhost#1');
    window.history.pushState(null, '', 'http://localhost#2');
    window.history.pushState(null, '', 'http://localhost#3');
    window.history.replaceState(null, '', 'http://localhost#4');
    window.history.forward();
    window.history.back();


    expect( pushState).toHaveBeenCalledTimes(3);
    expect(forward).toHaveBeenCalledTimes(1);
    expect(back).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledTimes(1);
  });
});
