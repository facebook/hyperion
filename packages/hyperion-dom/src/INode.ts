/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { IEventTargetPrototype } from "./IEventTarget";

export const INodePrototype = new DOMShadowPrototype(Node, IEventTargetPrototype, { sampleObject: sampleHTMLElement });

export const appendChild = new FunctionInterceptor('appendChild', INodePrototype);
export const cloneNode = new FunctionInterceptor('cloneNode', INodePrototype);
export const insertBefore = new FunctionInterceptor('insertBefore', INodePrototype);
export const removeChild = new FunctionInterceptor('removeChild', INodePrototype);
export const replaceChild = new FunctionInterceptor('replaceChild', INodePrototype);