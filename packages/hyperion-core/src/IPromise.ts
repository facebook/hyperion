/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { registerShadowPrototype, getOwnShadowPrototypeOf } from "./intercept";
import { interceptMethod } from "./MethodInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

const PromisePrototype = Object.getPrototypeOf(Promise.resolve());

/**
 * Usually in test environment, this module may be initialized multiple times.
 * But since it updates the global primodials, we should be careful to not redo
 * all the interception again. Specially since interceptMethod will pickup the
 * right (original) set of interceptors, we don't want to have a different ShadowPrototype
 */
export const IPromisePrototype = getOwnShadowPrototypeOf<ShadowPrototype<Promise<unknown>>>(PromisePrototype) ?? registerShadowPrototype(PromisePrototype, new ShadowPrototype<Promise<unknown>>(PromisePrototype, null));
export const then = interceptMethod("then", IPromisePrototype);
export const Catch = interceptMethod("catch", IPromisePrototype);
