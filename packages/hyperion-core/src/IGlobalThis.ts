/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import globalThis from "@hyperion/global/src/global";
import { interceptMethod } from "./MethodInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

interface GlobalScope extends Pick<Window, "setTimeout" | "setInterval"> {
  Promise: typeof Promise;
}

export const IGlobalThisPrototype = new ShadowPrototype(<GlobalScope>globalThis, null);

export const setInterval = interceptMethod("setInterval", IGlobalThisPrototype);
export const setTimeout = interceptMethod("setTimeout", IGlobalThisPrototype);
