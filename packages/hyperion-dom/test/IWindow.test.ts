/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IWindow from "../src/IWindow";
import { fetch } from "cross-fetch";
import { intercept } from "@hyperion/hyperion-core/src/intercept";

describe('test Window interception', () => {
  test('test fetch', () => {
    let result: any[] = [];
    const observer = (function <T, V>(this: T, value: V) {
      result.push([this, value]);
    });

    IWindow.fetch.onBeforeCallObserverAdd(observer);
    IWindow.fetch.onAfterCallObserverAdd(observer);

    if (typeof window.fetch !== "function") {
      window.fetch = function () {
        return fetch.apply(this, arguments);
      }
    }

    intercept(window);

    const url = "http://www.example.com";
    window.fetch(url);//.then(value => console.log(value.text));
    expect(result[0][1]).toBe(url);
  });
})