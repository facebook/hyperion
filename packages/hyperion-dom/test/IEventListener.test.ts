/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import { CallbackType, interceptEventListener, isEventListenerObject } from "../src/IEventListener";
import * as IEventTarget from "../src/IEventTarget";
import * as IGlobalEventHandlers from "../src/IGlobalEventHandlers";

function wrapListener<T extends CallbackType>(listener: T | null, observer: jest.Mock<any, any>) {
  if (!listener) {
    return listener;
  }
  const wrapped = interceptEventListener(listener);
  wrapped.onArgsObserverAdd(observer);
  if (!isEventListenerObject(listener)) {
    return wrapped.interceptor;
  }
  return listener;
}

describe('test event listener interception', () => {
  test("test event listener", async () => {
    const observer = jest.fn();
    IEventTarget.addEventListener.onArgsMapperAdd(([type, listener]) => {
      return [type, wrapListener(listener, observer)];
    });

    let resolveClick;
    const clicked = new Promise(resolve => resolveClick = resolve);

    document.head.addEventListener("click", ev => {
      resolveClick(1);
    });
    document.head.dispatchEvent(new Event("click"));
    const r = await clicked;
    expect(r).toBe(1);
    expect(observer).toBeCalledTimes(1);
  });

  false && test("test event listener object", async () => {
    const observer = jest.fn();
    IEventTarget.addEventListener.onArgsMapperAdd(([type, listener]) => {
      return [type, wrapListener(listener, observer)];
    });

    let resolveClick;
    const clicked = new Promise(resolve => resolveClick = resolve);

    document.head.addEventListener("click", {
      handleEvent: ev => {
        resolveClick(1);
      }
    });
    document.head.dispatchEvent(new Event("click"));
    const r = await clicked;
    expect(r).toBe(1);
    expect(observer).toBeCalledTimes(1);
  });

  test("test on-event listener", async () => {
    const observer = jest.fn();
    IGlobalEventHandlers.onclick.setter.onArgsMapperAdd(([listener]) => {
      return [wrapListener(listener, observer)];
    });

    let resolveClick;
    const clicked = new Promise(resolve => resolveClick = resolve);

    document.head.onclick = ev => {
      resolveClick(1);
    };

    document.head.dispatchEvent(new Event("click"));
    const r = await clicked;
    expect(r).toBe(1);
    expect(observer).toBeCalledTimes(1);
  });
});