/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor, interceptAttributeBase } from "hyperion-core/src/AttributeInterceptor";
import { ShadowPrototype } from "hyperion-core/src/ShadowPrototype";
import { ElementAttributeInterceptor } from "./ElementAttributeInterceptor";


class EventHandlerAttributeInterceptor<
  BaseType extends EventTarget & { [key: string]: any },
  Name extends string,
> extends AttributeInterceptor<BaseType, Name> {

}

/**
 * Use this function when even even handler cannot be also added via
 * a setAttribute or Attr.value on the element.
 * This usually applies to non-element nodes.
 */
export function interceptEventHandlerAttribute<
  BaseType extends EventTarget & { [key: string]: any },
  Name extends string,
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>
): EventHandlerAttributeInterceptor<BaseType, Name> {
  return interceptAttributeBase<BaseType, Name, BaseType[Name], BaseType[Name], EventHandlerAttributeInterceptor<BaseType, Name>>(name, shadowPrototype, EventHandlerAttributeInterceptor);
}

class ElementEventHandlerAttributeInterceptor<
  BaseType extends Element & { [key: string]: any },
  Name extends string,
> extends ElementAttributeInterceptor<BaseType, Name, BaseType[Name], BaseType[Name]> {

}

/**
 * Use this function when the event handler can be set via node.onX
 * as well as node.setAttribute("X", ....) or node.getAttributeNode("X").value = ...
 * This mostly applies to Elements. 
 * In these cases, one need to cover both raw (text) and processed (function) values
 * for the handler. 
 */
export function interceptElementEventHandlerAttribute<
  BaseType extends Element & { [key: string]: any },
  Name extends string,
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>
): ElementEventHandlerAttributeInterceptor<BaseType, Name> {
  return interceptAttributeBase<BaseType, Name, BaseType[Name], BaseType[Name], ElementEventHandlerAttributeInterceptor<BaseType, Name>>(name, shadowPrototype, ElementEventHandlerAttributeInterceptor);
}

