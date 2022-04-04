/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import { FunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { DOMShadowPrototype } from "./DOMShadowPrototype";
import { IEventTargetPrototype } from "./IEventTarget";

export const IXMLHttpRequestPrototype = new DOMShadowPrototype(XMLHttpRequest, IEventTargetPrototype, { sampleObject: new XMLHttpRequest(), registerOnPrototype: true });

export const open = new FunctionInterceptor("open", IXMLHttpRequestPrototype);
export const send = new FunctionInterceptor("send", IXMLHttpRequestPrototype);
export const withCredentials = new AttributeInterceptor("withCredentials", IXMLHttpRequestPrototype);
