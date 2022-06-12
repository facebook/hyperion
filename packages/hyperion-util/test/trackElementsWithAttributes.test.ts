/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
  * @jest-environment jsdom
 */

import "jest";
import { trackElementsWithAttributes } from "../src/trackElementsWithAttributes";

describe('test monitoring element attributes', () => {
  test('test monitoring element attributes', () => {
    const attributes = [
      "a",
      "b",
      "c"
    ];

    const hook = trackElementsWithAttributes(attributes);
    const receivedElems: Element[] = [];
    hook.add(elem => receivedElems.push(elem));

    const expectedElements = attributes.map(attr => {
      const elem = window.document.createElement("div");
      elem.setAttribute(attr, "1");
      return elem;
    });

    expect(receivedElems).toStrictEqual(receivedElems);
  });
})