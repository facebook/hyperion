/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptAttribute } from "hyperion-core/src/AttributeInterceptor";
import { interceptMethod } from "hyperion-core/src/MethodInterceptor";
// import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { interceptElementAttribute } from "./ElementAttributeInterceptor";
// import { INodePrototype } from "./INode";
import * as IElememt_ from "./IElement_";
export * from "./IElement_";

/**
 * See IElement_ for details.
 */
export const IElementtPrototype = IElememt_.IElementtPrototype;

export const after = interceptMethod('after', IElementtPrototype);
export const append = interceptMethod('append', IElementtPrototype);
export const before = interceptMethod('before', IElementtPrototype);
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
export const prepend = interceptMethod('prepend', IElementtPrototype);
export const remove = interceptMethod('remove', IElementtPrototype);
export const removeAttribute = interceptMethod('removeAttribute', IElementtPrototype);
export const removeAttributeNode = interceptMethod('removeAttributeNode', IElementtPrototype);
export const removeAttributeNS = interceptMethod('removeAttributeNS', IElementtPrototype);
export const replaceChildren = interceptMethod('replaceChildren', IElementtPrototype);
export const replaceWith = interceptMethod('replaceWith', IElementtPrototype);
export const toggleAttribute = interceptMethod('toggleAttribute', IElementtPrototype);

export const id = interceptElementAttribute("id", IElementtPrototype);
export const innerHTML = interceptAttribute("innerHTML", IElementtPrototype);
