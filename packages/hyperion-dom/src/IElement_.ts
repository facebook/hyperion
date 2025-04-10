/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 * 
 * This file only contains set of features that ElementAttributeInterceptor
 * needs. They are here to avoid circular depndency between modules.
 * We should only include what is needed by IElementCustom which is called
 * by ElementAttributeInterceptor, which in turn is called by IElement.
 * Specifically, we should never add any attribute interceptor here.
 */

import { interceptMethod } from "hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { INodePrototype } from "./INode";

export const IElementtPrototype = new DOMShadowPrototype(
  Element,
  INodePrototype,
  {
    sampleObject: sampleHTMLElement,
    nodeType: document.ELEMENT_NODE
  }
);
IElementtPrototype.extension.useCaseInsensitivePropertyName = true;

export const getAttribute = interceptMethod('getAttribute', IElementtPrototype);
export const getAttributeNS = interceptMethod('getAttributeNS', IElementtPrototype);
export const setAttribute = interceptMethod('setAttribute', IElementtPrototype);
export const setAttributeNS = interceptMethod('setAttributeNS', IElementtPrototype);
export const setAttributeNode = interceptMethod('setAttributeNode', IElementtPrototype);
export const setAttributeNodeNS = interceptMethod('setAttributeNodeNS', IElementtPrototype);
