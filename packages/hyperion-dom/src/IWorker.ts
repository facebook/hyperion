/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { EventHandlerAttributeInterceptor } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";

/**
 * In jest environment Worker is not defined. The following will allow tests to run
 * while actually keeping the feature enabled for browsers. 
 */
const WorkerClass = window.Worker ?? { prototype: <Worker><unknown>IEventTargetPrototype.targetPrototype, }
export const IWorkerPrototype = new DOMShadowPrototype<Worker, EventTarget>(WorkerClass, IEventTargetPrototype, { registerOnPrototype: true });

export const onmessage = new EventHandlerAttributeInterceptor("onmessage", IWorkerPrototype);
export const onmessageerror = new EventHandlerAttributeInterceptor("onmessageerror", IWorkerPrototype);
export const onerror = new EventHandlerAttributeInterceptor("onerror", IWorkerPrototype);