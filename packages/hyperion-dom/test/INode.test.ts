/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as INode from "../src/INode";

describe('test Node interception', () => {
  test('test add to tree', () => {
    let result: any[] = [];
    const observer = (function <T, V>(this: T, value: V) {
      result = [this, value];
    });

    INode.insertBefore.onBeforeCallObserverAdd(observer);
    INode.removeChild.onBeforeCallObserverAdd(observer);
    INode.replaceChild.onBeforeCallObserverAdd(observer);

    const elem = window.document.createElement("p");
    const child1 = window.document.createElement("a");
    const child2 = window.document.createElement("b");
    let testCount = 0;

    INode.appendChild.onBeforeCallObserverRemove(
      INode.appendChild.onBeforeCallObserverAdd(function (this, node) {
        expect([this, node]).toStrictEqual([elem, child1]);
        testCount++;
      })
    );
    elem.appendChild(child1);
    elem.appendChild(child2);

    INode.removeChild.onBeforeCallObserverAdd(function (this, node) {
      expect([this, node]).toStrictEqual([elem, child2]);
      testCount++;
    });
    elem.removeChild(child2);

    INode.insertBefore.onBeforeCallObserverAdd(function (this, newNode, referenceNode) {
      expect([this, newNode, referenceNode]).toStrictEqual([elem, child2, child1]);
      testCount++;
    });
    elem.insertBefore(child2, child1);
    elem.removeChild(child2);

    INode.replaceChild.onBeforeCallObserverAdd(function (this, newChild, oldChild) {
      expect([this, newChild, oldChild]).toStrictEqual([elem, child2, child1]);
      testCount++;
    });
    elem.replaceChild(child2, child1);
    expect(testCount).toBe(4);
    expect(elem.outerHTML).toBe("<p><b></b></p>");
  })
})