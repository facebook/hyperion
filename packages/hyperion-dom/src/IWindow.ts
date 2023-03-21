/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptConstructorMethod } from "@hyperion/hyperion-core/src/ConstructorInterceptor";
import { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { interceptEventHandlerAttribute } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";

export const IWindowPrototype = new DOMShadowPrototype(Window, IEventTargetPrototype, { targetPrototype: window, registerOnPrototype: true });

export const fetch = interceptMethod("fetch", IWindowPrototype);
export const requestAnimationFrame = interceptMethod("requestAnimationFrame", IWindowPrototype);
export const requestIdleCallback = interceptMethod("requestIdleCallback", IWindowPrototype);
export const IntersectionObserver = interceptConstructorMethod("IntersectionObserver", IWindowPrototype);
export const MutationObserver = interceptConstructorMethod("MutationObserver", IWindowPrototype);
export const XMLHttpRequest = interceptConstructorMethod("XMLHttpRequest", IWindowPrototype);


//#region Event Handlers https://developer.mozilla.org/en-US/docs/Web/API/Window#event_handlers
export const onerror = interceptEventHandlerAttribute("onerror", IWindowPrototype);

export const ondevicemotion = interceptEventHandlerAttribute("ondevicemotion", IWindowPrototype);
export const ondeviceorientation = interceptEventHandlerAttribute("ondeviceorientation", IWindowPrototype);
export const onorientationchange = interceptEventHandlerAttribute("onorientationchange", IWindowPrototype);
//#endretion
