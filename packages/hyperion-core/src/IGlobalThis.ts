/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import globalScope from "@hyperion/global/src/global";
import { interceptMethod } from "./MethodInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";
import { getOwnShadowPrototypeOf, registerShadowPrototype } from "./intercept";

interface GlobalScope extends Pick<Window, "setTimeout" | "setInterval"> {
  Promise: typeof Promise;
}

/**
 * Usually in test environment, this module may be initialized multiple times.
 * But since it updates the global primodials, we should be careful to not redo
 * all the interception again. Specially since interceptMethod will pickup the
 * right (original) set of interceptors, we don't want to have a different ShadowPrototype
 */
export const IGlobalThisPrototype = getOwnShadowPrototypeOf<ShadowPrototype<GlobalScope>>(globalScope) ?? registerShadowPrototype(globalScope, new ShadowPrototype<GlobalScope>(<GlobalScope>globalScope, null));

export const setInterval = interceptMethod("setInterval", IGlobalThisPrototype);
export const setTimeout = interceptMethod("setTimeout", IGlobalThisPrototype);
