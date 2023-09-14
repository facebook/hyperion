/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";

export const IEventPrototype = new DOMShadowPrototype(Event, null, { sampleObject: new Event("tmp"), registerOnPrototype: true });

export const stopPropagation = interceptMethod('stopPropagation', IEventPrototype);
