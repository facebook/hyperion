/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptMethod } from "hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";

export const IHistoryPrototype = new DOMShadowPrototype(History, null, { sampleObject: window.history, registerOnPrototype: true });

export const back = interceptMethod('back', IHistoryPrototype);
export const forward = interceptMethod('forward', IHistoryPrototype);
export const go = interceptMethod('go', IHistoryPrototype);
export const pushState = interceptMethod('pushState', IHistoryPrototype);
export const replaceState = interceptMethod('replaceState', IHistoryPrototype);
