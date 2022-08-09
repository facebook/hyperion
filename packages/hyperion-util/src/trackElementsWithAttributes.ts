/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";
import { interceptElementAttribute } from "@hyperion/hyperion-dom/src/ElementAttributeInterceptor";
import { IElementtPrototype } from "@hyperion/hyperion-dom/src/IElement";

type ResultHook = Hook<(elem: Element, attrbuteName: string, attrbuteValue: string) => void>

export function trackElementsWithAttributes(attributeNames: string[]): ResultHook {
  const hook: ResultHook = new Hook();

  for (let i = 0, len = attributeNames.length; i < len; ++i) {
    const attr = attributeNames[i];
    const vattr = interceptElementAttribute(attr, IElementtPrototype);
    vattr.raw.setter.onArgsObserverAdd(function (this, value) {
      hook.call(this, attr, value);
    });
  }

  return hook;
}