/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptAttribute } from "hyperion-core/src/AttributeInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import * as IElement from "./IElement";

export const IHTMLElementtPrototype = new DOMShadowPrototype(
  HTMLElement,
  IElement.IElementtPrototype,
  {
    sampleObject: sampleHTMLElement,
    nodeType: document.ELEMENT_NODE
  }
);

export const style = interceptAttribute("style", IHTMLElementtPrototype);
