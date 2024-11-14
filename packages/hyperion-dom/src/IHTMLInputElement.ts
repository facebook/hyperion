/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptAttribute } from "hyperion-core/src/AttributeInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import * as IHTMLElement from "./IHTMLElement";

export const IHTMLInputElementPrototype = new DOMShadowPrototype(
  HTMLInputElement,
  IHTMLElement.IHTMLElementtPrototype,
  {
    sampleObject: document.createElement("input"),
    nodeType: document.ELEMENT_NODE
  }
);

export const checked = interceptAttribute("checked", IHTMLInputElementPrototype);
