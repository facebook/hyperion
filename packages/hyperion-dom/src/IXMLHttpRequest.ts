/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { EventHandlerAttributeInterceptor } from "./EventHandlerAttributeInterceptor";
import { IEventTargetPrototype } from "./IEventTarget";

export const IXMLHttpRequestPrototype = new DOMShadowPrototype(XMLHttpRequest, IEventTargetPrototype, { sampleObject: new XMLHttpRequest(), registerOnPrototype: true });

export const open = new FunctionInterceptor("open", IXMLHttpRequestPrototype);
export const send = new FunctionInterceptor("send", IXMLHttpRequestPrototype);
export const withCredentials = new AttributeInterceptor("withCredentials", IXMLHttpRequestPrototype);

export const onabort = new EventHandlerAttributeInterceptor("onabort", IXMLHttpRequestPrototype);
export const onerror = new EventHandlerAttributeInterceptor("onerror", IXMLHttpRequestPrototype);
export const onload = new EventHandlerAttributeInterceptor("onload", IXMLHttpRequestPrototype);
export const onloadend = new EventHandlerAttributeInterceptor("onloadend", IXMLHttpRequestPrototype);
export const onloadstart = new EventHandlerAttributeInterceptor("onloadstart", IXMLHttpRequestPrototype);
export const onprogress = new EventHandlerAttributeInterceptor("onprogress", IXMLHttpRequestPrototype);
export const ontimeout = new EventHandlerAttributeInterceptor("ontimeout", IXMLHttpRequestPrototype);
