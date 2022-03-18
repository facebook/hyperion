/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";
import { ElementAttributeInterceptor } from "@hyperion/hyperion-dom/src/ElementAttributeInterceptor";
import { IElementtPrototype } from "@hyperion/hyperion-dom/src/IElement";

export default function trackElementsWithAttributes(attributeNames: string[]): Hook<(elem: Element) => void> {
  const hook = new Hook<(elem: Element) => void>();

  const callback = function (this: Element) {
    hook.call(this);
  }

  for (const attr of attributeNames) {
    const vattr = new ElementAttributeInterceptor(attr, IElementtPrototype);
    vattr.raw.setter.onArgsObserverAdd(callback);
  }

  return hook;
}