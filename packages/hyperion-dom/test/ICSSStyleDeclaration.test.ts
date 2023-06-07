/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as ICSSStyleDeclaration from "../src/ICSSStyleDeclaration";

describe('test element style interception', () => {
  false && test('test get/set/remove property', () => {
    const setterArgs = jest.fn(function () {
      console.log('setterArgs called', arguments);
    });
    const getterArgs = jest.fn(function () {
      console.log('getterArgs called', arguments);
    });
    const getterValue = jest.fn(function () {
      console.log('getterValue called', arguments);
    });

    ICSSStyleDeclaration.setProperty.onBeforeCallArgsObserverAdd(setterArgs);
    ICSSStyleDeclaration.getPropertyValue.onBeforeCallArgsObserverAdd(getterArgs);
    ICSSStyleDeclaration.getPropertyValue.onAfterReturnValueObserverAdd(getterValue);

    let elem: HTMLElement;
    elem = window.document.createElement("P");
    elem.style.setProperty("display", "none");

    expect(setterArgs).toBeCalledTimes(1);
    expect(setterArgs.mock.calls[0][0]).toBe("display");
    expect(setterArgs.mock.calls[0][1]).toBe("none");

    const display = elem.style.getPropertyValue("display");
    expect(display).toBe("none");

    // Note that jest dom internally calls getPropertyValue itself one more time! So, instead of 1, we have 2 times call
    expect(getterArgs).toBeCalledTimes(2);
    expect(getterArgs.mock.calls[1][0]).toBe("display");

    expect(getterValue).toBeCalledTimes(2);
    expect(getterValue.mock.calls[0][0]).toBe("none");
  });

  test('test block setting block value', () => {
    ICSSStyleDeclaration.setProperty.onBeforeCallArgsObserverAdd((property, value) => {
      const blocked = (property === "display" && value === "block");
      if (blocked) {
        console.log("Will block:", property, value);
      }
      return blocked;
    });

    let elem: HTMLElement;
    elem = window.document.createElement("P");

    elem.style.setProperty("display", "flex");
    let display = elem.style.getPropertyValue("display");
    expect(display).toBe("flex");

    elem.style.setProperty("display", "block");
    display = elem.style.getPropertyValue("display");
    expect(display).toBe("flex");
  });
});