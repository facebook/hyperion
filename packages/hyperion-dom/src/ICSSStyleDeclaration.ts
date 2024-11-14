/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptMethod } from "hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";

export const ICSSStyleDeclarationPrototype = new DOMShadowPrototype(CSSStyleDeclaration, null, { sampleObject: sampleHTMLElement.style, });
ICSSStyleDeclarationPrototype.extension.useCaseInsensitivePropertyName = true;

export const getPropertyValue = interceptMethod("getPropertyValue", ICSSStyleDeclarationPrototype);
export const removeProperty = interceptMethod("removeProperty", ICSSStyleDeclarationPrototype);
export const setProperty = interceptMethod("setProperty", ICSSStyleDeclarationPrototype);
