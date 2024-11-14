/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptMethod } from "hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { IEventTargetPrototype } from "./IEventTarget";

export const INodePrototype = new DOMShadowPrototype(Node, IEventTargetPrototype, { sampleObject: sampleHTMLElement });

export const appendChild = interceptMethod('appendChild', INodePrototype);
export const cloneNode = interceptMethod('cloneNode', INodePrototype, true);
export const insertBefore = interceptMethod('insertBefore', INodePrototype);
export const removeChild = interceptMethod('removeChild', INodePrototype);
export const replaceChild = interceptMethod('replaceChild', INodePrototype);