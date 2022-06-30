/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { registerShadowPrototype } from "./intercept";
import { interceptMethod } from "./MethodInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

const PromisePrototype = Object.getPrototypeOf(Promise.resolve());

export const IPromisePrototype = new ShadowPrototype<Promise<unknown>>(PromisePrototype, null);
export const then = interceptMethod("then", IPromisePrototype);
export const Catch = interceptMethod("catch", IPromisePrototype);

registerShadowPrototype(PromisePrototype, IPromisePrototype);
