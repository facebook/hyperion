/**
 * @jest-environment jsdom
 */

import "jest";
import * as IElement from "../src/IElement";

describe('test Element', () => {
  test('test getAttribute', () => {
    let result = [];
    IElement.getAttribute.onArgsObserverAdd(function (this, value) {
      result.push(this);
      result.push(value);
    });

    const elem = window.document.createElement("div");
    elem.setAttribute("test", "test");
    elem.getAttribute("test");
    expect(result).toStrictEqual([elem, "test"]);
  });
})