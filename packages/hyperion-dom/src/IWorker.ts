/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { EventHandlerAttributeInterceptor } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";

export const IWorkerPrototype = new DOMShadowPrototype(Worker, IEventTargetPrototype, { registerOnPrototype: true });

export const onmessage = new EventHandlerAttributeInterceptor("onmessage", IWorkerPrototype);
export const onmessageerror = new EventHandlerAttributeInterceptor("onmessageerror", IWorkerPrototype);
export const onerror = new EventHandlerAttributeInterceptor("onerror", IWorkerPrototype);