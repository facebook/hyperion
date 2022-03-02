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

  test('test innerHTML', () => {
    let result = [];
    let target: Node;
    let addedNodes: Node[];
    let removedNodes: Node[];

    IElement.innerHTML.setter.onArgsObserverAdd(function (this, value) {
      target = this;
      removedNodes = [...target.childNodes]; // child nodes is a live list, should make a copy
    });
    IElement.innerHTML.setter.onValueObserverAdd(function (this) {
      // Now it is done, we can read the results
      expect(this).toBe(target);
      addedNodes = [...target.childNodes];
    });


    const elem = window.document.createElement("div");
    elem.innerHTML = "<p><b>test</b></p>";
    expect(removedNodes).toStrictEqual([]);
    const oldNodes = addedNodes;

    elem.innerHTML = "<center>test<center>";
    expect(oldNodes).toStrictEqual(removedNodes);
  });
});