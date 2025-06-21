/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor, interceptAttributeBase } from "hyperion-core/src/AttributeInterceptor";
import { ShadowPrototype } from "hyperion-core/src/ShadowPrototype";


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
