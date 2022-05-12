/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { ConstructorInterceptor } from "@hyperion/hyperion-core/src/ConstructorInterceptor";
import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { EventHandlerAttributeInterceptor } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";

export const IWindowPrototype = new DOMShadowPrototype(Window, IEventTargetPrototype, { sampleObject: window, registerOnPrototype: true });

export const fetch = new FunctionInterceptor("fetch", IWindowPrototype);
export const requestAnimationFrame = new FunctionInterceptor("requestAnimationFrame", IWindowPrototype);
export const requestIdleCallback = new FunctionInterceptor("requestIdleCallback", IWindowPrototype);
export const setInterval = new FunctionInterceptor("setInterval", IWindowPrototype);
export const setTimeout = new FunctionInterceptor("setTimeout", IWindowPrototype);
export const IntersectionObserver = new ConstructorInterceptor("IntersectionObserver", IWindowPrototype);
export const MutationObserver = new ConstructorInterceptor("MutationObserver", IWindowPrototype);
export const XMLHttpRequest = new ConstructorInterceptor("XMLHttpRequest", IWindowPrototype);


//#region Event Handlers https://developer.mozilla.org/en-US/docs/Web/API/Window#event_handlers
export const onerror = new EventHandlerAttributeInterceptor("onerror", IWindowPrototype);

export const ondevicemotion = new EventHandlerAttributeInterceptor("ondevicemotion", IWindowPrototype);
export const ondeviceorientation = new EventHandlerAttributeInterceptor("ondeviceorientation", IWindowPrototype);
export const onorientationchange = new EventHandlerAttributeInterceptor("onorientationchange", IWindowPrototype);
//#endretion
