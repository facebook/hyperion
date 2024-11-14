/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptAttribute } from "hyperion-core/src/AttributeInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { INodePrototype } from "./INode";

export const IAttrPrototype = new DOMShadowPrototype(
  Attr,
  INodePrototype,
  {
    sampleObject: sampleHTMLElement.attributes[0],
    nodeType: document.ATTRIBUTE_NODE
  }
);

export const value = interceptAttribute("value", IAttrPrototype);