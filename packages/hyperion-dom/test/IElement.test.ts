/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IElement from "../src/IElement";
import { VirtualAttribute } from "../src/VirtualAttribute";

describe('test Element', () => {
  test('test getAttribute', () => {
    let result: any[] = [];
    const observer = IElement.getAttribute.onBeforeCallArgsObserverAdd(function (this, value) {
      result.push(this);
      result.push(value);
    });

    const elem = window.document.createElement("div");
    elem.setAttribute("test", "test");
    elem.getAttribute("test");
    expect(result).toStrictEqual([elem, "test"]);

    IElement.getAttribute.onBeforeCallArgsObserverRemove(observer);
  });

  test('test innerHTML', () => {
    let result = [];
    let target: Node;
    let addedNodes: Node[] = [];
    let removedNodes: Node[] = [];

    IElement.innerHTML.setter.onBeforeCallArgsObserverAdd(function (this, value) {
      target = this;
      removedNodes = [...target.childNodes]; // child nodes is a live list, should make a copy
    });
    IElement.innerHTML.setter.onAfterReturnValueObserverAdd(function (this) {
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

  test("Element attributes", () => {
    let result: any[] = [];
    let observer = <T>(value: T) => { result.push(value) };
    const expectResultTobe = (expected: any[]) => {
      expect(result).toStrictEqual(expected);
      result = [];
    }


    const vId = IElement.IElementtPrototype.getVirtualProperty<VirtualAttribute>("id");
    vId.rawValue.getter.onAfterReturnValueObserverAdd(observer);
    vId.rawValue.setter.onBeforeCallArgsObserverAdd(observer);
    vId.processedValue.getter.onAfterReturnValueObserverAdd(observer);
    vId.processedValue.setter.onBeforeCallArgsObserverAdd(observer);

    const elem = window.document.createElement("div");
    [
      id => elem.id = id,
      id => (elem.setAttribute("id", id), id),
      id => {
        const attr = elem.getAttributeNode("id");
        if (attr) {
          attr.value = id;
        }
        return id;
      },
      id => elem.attributes["id"].value = id,
      id => {
        const attr = document.createAttribute("id");
        attr.value = id;
        elem.setAttributeNode(attr);
        return '' + id;
      }
    ].forEach((setter, index) => {
      const result = setter(index);
      expectResultTobe([result]);
    });
  });
});