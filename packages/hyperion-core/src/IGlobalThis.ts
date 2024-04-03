/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import globalScope from "@hyperion/hyperion-global/src/global";
import { interceptMethod } from "./MethodInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";
import { getOwnShadowPrototypeOf } from "./intercept";
import { interceptConstructorMethod } from "./ConstructorInterceptor";

interface GlobalScope extends Pick<Window, "setTimeout" | "setInterval"> {
  Promise: typeof Promise;
}

/**
 * Usually in test environment, this module may be initialized multiple times.
 * But since it updates the global primodials, we should be careful to not redo
 * all the interception again. Specially since interceptMethod will pickup the
 * right (original) set of interceptors, we don't want to have a different ShadowPrototype
 * 
 * Also, in hyperion-dom, we do have interception of Window which is the globalThis of the browsers
 * That module will need to set the parent of the shadow prototype and register a few more information
 * To ensure that no one is really using the internal hooks of the ShadowPrototype for tracking object interception
 * the following IGlobalThisPrototype is kept local to this module and not exported. As of now all usecases of the
 * hyperion is in browser, if/when we support nodejs, there should be a similar mechanism for handling that environments
 * globalThis.
 * For this particular case, we are ok if the ShadowPrototype is not used. 
 */
const IGlobalThisPrototype = getOwnShadowPrototypeOf<ShadowPrototype<GlobalScope>>(globalScope) ?? new ShadowPrototype<GlobalScope>(<GlobalScope>globalScope, null);

export const setInterval = interceptMethod("setInterval", IGlobalThisPrototype);
export const setTimeout = interceptMethod("setTimeout", IGlobalThisPrototype);
export const IPromiseConstructor = interceptConstructorMethod<"Promise", GlobalScope, PromiseConstructor>("Promise", IGlobalThisPrototype);
