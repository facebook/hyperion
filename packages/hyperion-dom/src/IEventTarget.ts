/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { DOMShadowPrototype, sampleHTMLElement } from "./DOMShadowPrototype";
import { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";

export const IEventTargetPrototype = new DOMShadowPrototype(EventTarget, null, { sampleObject: sampleHTMLElement });

export const addEventListener = interceptMethod('addEventListener', IEventTargetPrototype);
export const dispatchEvent = interceptMethod('dispatchEvent', IEventTargetPrototype);
export const removeEventListener = interceptMethod('removeEventListener', IEventTargetPrototype);