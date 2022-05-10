/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { registerShadowPrototype } from "./intercept";
import { ShadowPrototype } from "./ShadowPrototype";

const PromisePrototype = Object.getPrototypeOf(Promise.resolve());

export const IPromisePrototype = new ShadowPrototype<Promise<unknown>>(PromisePrototype, null);
export const then = new FunctionInterceptor("then", IPromisePrototype);
export const Catch = new FunctionInterceptor("catch", IPromisePrototype);

registerShadowPrototype(PromisePrototype, IPromisePrototype);
