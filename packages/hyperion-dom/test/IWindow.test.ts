/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IWindow from "../src/IWindow";
import { intercept } from "hyperion-core/src/intercept";

describe('test Window interception', () => {
  test('test fetch', () => {
    let result: any[] = [];
    const observer = (function <T, V>(this: T, value: V) {
      result.push([this, value]);
    });

    IWindow.fetch.onBeforeCallObserverAdd(observer);
    IWindow.fetch.onAfterCallObserverAdd(observer);

    window.fetch = jest.fn(() => Promise.resolve({} as Response));

    intercept(window);

    const url = "http://www.example.com";
    window.fetch(url);//.then(value => console.log(value.text));
    expect(result[0][1]).toBe(url);
  });
})
