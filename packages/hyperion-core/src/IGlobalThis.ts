/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";
import globalThis from "@hyperion/global/src/global";

interface GlobalScope extends Pick<Window, "setTimeout" | "setInterval"> {
  Promise: typeof Promise;
}

export const IGlobalThisPrototype = new ShadowPrototype(<GlobalScope>globalThis, null);

export const setInterval = new FunctionInterceptor("setInterval", IGlobalThisPrototype);
export const setTimeout = new FunctionInterceptor("setTimeout", IGlobalThisPrototype);
