/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import "jest";
import * as IDocument from "../src/IDocument";

describe('test Document interception', () => {
  test('test create element', () => {
    let result: any[] = [];
    const observer = (function <T, V>(this: T, value: V) {
      result = [this, value];
    });

    IDocument.createElement.onArgsObserverAdd(observer);
    IDocument.createElement.onValueObserverAdd(value => result.push(value));

    let elem: Node;
    elem = window.document.createElement("P");
    expect(result).toStrictEqual([window.document, elem.nodeName, elem]);

    elem = window.document.createElement("A");
    expect(result).toStrictEqual([window.document, elem.nodeName, elem]);

    elem = window.document.createElement("B");
    expect(result).toStrictEqual([window.document, elem.nodeName, elem]);
  })
})