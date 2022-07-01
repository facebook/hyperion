/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptAttribute } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
// import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { interceptElementAttribute } from "./ElementAttributeInterceptor";
// import { INodePrototype } from "./INode";
import * as IElememt_ from "./IElement_";
export * from "./IElement_";

// export const IElementtPrototype = new DOMShadowPrototype(
//   Element,
//   INodePrototype,
//   {
//     sampleObject: sampleHTMLElement,
//     nodeType: document.ELEMENT_NODE
//   }
// );
export const IElementtPrototype = IElememt_.IElementtPrototype;

// export const getAttribute = interceptMethod('getAttribute', IElementtPrototype);
// export const getAttributeNS = interceptMethod('getAttributeNS', IElementtPrototype);
export const getAttributeNames = interceptMethod('getAttributeNames', IElementtPrototype);
export const getAttributeNode = interceptMethod('getAttributeNode', IElementtPrototype, true);
export const getAttributeNodeNS = interceptMethod('getAttributeNodeNS', IElementtPrototype, true);
export const getBoundingClientRect = interceptMethod('getBoundingClientRect', IElementtPrototype);
export const getClientRects = interceptMethod('getClientRects', IElementtPrototype);
export const getElementsByClassName = interceptMethod('getElementsByClassName', IElementtPrototype);
export const getElementsByTagName = interceptMethod('getElementsByTagName', IElementtPrototype);
export const getElementsByTagNameNS = interceptMethod('getElementsByTagNameNS', IElementtPrototype);
export const hasAttribute = interceptMethod('hasAttribute', IElementtPrototype);
export const hasAttributeNS = interceptMethod('hasAttributeNS', IElementtPrototype);
export const hasAttributes = interceptMethod('hasAttributes', IElementtPrototype);
export const insertAdjacentElement = interceptMethod('insertAdjacentElement', IElementtPrototype);
export const insertAdjacentHTML = interceptMethod('insertAdjacentHTML', IElementtPrototype);
export const insertAdjacentText = interceptMethod('insertAdjacentText', IElementtPrototype);
export const removeAttribute = interceptMethod('removeAttribute', IElementtPrototype);
export const removeAttributeNS = interceptMethod('removeAttributeNS', IElementtPrototype);
export const removeAttributeNode = interceptMethod('removeAttributeNode', IElementtPrototype);
// export const setAttribute = interceptMethod('setAttribute', IElementtPrototype);
// export const setAttributeNS = interceptMethod('setAttributeNS', IElementtPrototype);
// export const setAttributeNode = interceptMethod('setAttributeNode', IElementtPrototype);
// export const setAttributeNodeNS = interceptMethod('setAttributeNodeNS', IElementtPrototype);
export const toggleAttribute = interceptMethod('toggleAttribute', IElementtPrototype);

export const id = interceptElementAttribute("id", IElementtPrototype);
export const innerHTML = interceptAttribute("innerHTML", IElementtPrototype);
