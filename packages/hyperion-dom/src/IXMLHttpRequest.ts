/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { interceptAttribute } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import { interceptMethod } from "@hyperion/hyperion-core/src/MethodInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { interceptEventHandlerAttribute } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";
import { interceptConstructorMethod } from "@hyperion/hyperion-core/src/ConstructorInterceptor";
import { IWindowPrototype } from "./IWindow";

export const IXMLHttpRequestPrototype = new DOMShadowPrototype(XMLHttpRequest, IEventTargetPrototype, { sampleObject: new XMLHttpRequest(), registerOnPrototype: true });

export const constructor = interceptConstructorMethod<"XMLHttpRequest", Window, { new(): XMLHttpRequest }>("XMLHttpRequest", IWindowPrototype);

export const open = interceptMethod("open", IXMLHttpRequestPrototype);
export const send = interceptMethod("send", IXMLHttpRequestPrototype);
export const withCredentials = interceptAttribute("withCredentials", IXMLHttpRequestPrototype);

export const onabort = interceptEventHandlerAttribute("onabort", IXMLHttpRequestPrototype);
export const onerror = interceptEventHandlerAttribute("onerror", IXMLHttpRequestPrototype);
export const onload = interceptEventHandlerAttribute("onload", IXMLHttpRequestPrototype);
export const onloadend = interceptEventHandlerAttribute("onloadend", IXMLHttpRequestPrototype);
export const onloadstart = interceptEventHandlerAttribute("onloadstart", IXMLHttpRequestPrototype);
export const onprogress = interceptEventHandlerAttribute("onprogress", IXMLHttpRequestPrototype);
export const readystatechange = interceptEventHandlerAttribute("readystatechange", IXMLHttpRequestPrototype);
export const ontimeout = interceptEventHandlerAttribute("ontimeout", IXMLHttpRequestPrototype);
