/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptConstructorMethod } from "@hyperion/hyperion-core/src/ConstructorInterceptor";
import { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { EventHandlerAttributeInterceptor } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";

export const IWindowPrototype = new DOMShadowPrototype(Window, IEventTargetPrototype, { sampleObject: window, registerOnPrototype: true });

export const fetch = interceptMethod("fetch", IWindowPrototype);
export const requestAnimationFrame = interceptMethod("requestAnimationFrame", IWindowPrototype);
export const requestIdleCallback = interceptMethod("requestIdleCallback", IWindowPrototype);
export const setInterval = interceptMethod("setInterval", IWindowPrototype);
export const setTimeout = interceptMethod("setTimeout", IWindowPrototype);
export const IntersectionObserver = interceptConstructorMethod("IntersectionObserver", IWindowPrototype);
export const MutationObserver = interceptConstructorMethod("MutationObserver", IWindowPrototype);
export const XMLHttpRequest = interceptConstructorMethod("XMLHttpRequest", IWindowPrototype);


//#region Event Handlers https://developer.mozilla.org/en-US/docs/Web/API/Window#event_handlers
export const onerror = new EventHandlerAttributeInterceptor("onerror", IWindowPrototype);

export const ondevicemotion = new EventHandlerAttributeInterceptor("ondevicemotion", IWindowPrototype);
export const ondeviceorientation = new EventHandlerAttributeInterceptor("ondeviceorientation", IWindowPrototype);
export const onorientationchange = new EventHandlerAttributeInterceptor("onorientationchange", IWindowPrototype);
//#endretion
