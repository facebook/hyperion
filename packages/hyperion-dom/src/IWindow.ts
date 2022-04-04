/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { ConstructorInterceptor } from "@hyperion/hyperion-core/src/ConstructorInterceptor";
import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { IEventTargetPrototype } from "./IEventTarget";

export const IWindowPrototype = new DOMShadowPrototype(Window, IEventTargetPrototype, { sampleObject: window, registerOnPrototype: true });

export const fetch = new FunctionInterceptor("fetch", IWindowPrototype);
export const XMLHttpRequest = new ConstructorInterceptor("XMLHttpRequest", IWindowPrototype);
