/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor, getAttributeInterceptor } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import { ShadowPrototype } from "@hyperion/hyperion-core/src/ShadowPrototype";

class EventHandlerAttributeInterceptor<
  BaseType extends EventTarget & { [key: string]: any },
  Name extends string,
  > extends AttributeInterceptor<BaseType, Name> {

}

export function interceptEventHandlerAttribute<
  BaseType extends EventTarget & { [key: string]: any },
  Name extends string,
  >(
    name: Name,
    shadowPrototype: ShadowPrototype<BaseType>
  ): EventHandlerAttributeInterceptor<BaseType, Name> {
  const desc = getAttributeInterceptor<BaseType, Name, BaseType[Name], BaseType[Name], EventHandlerAttributeInterceptor<BaseType, Name>>(name, shadowPrototype);
  return desc?.interceptor ?? new EventHandlerAttributeInterceptor(name, shadowPrototype, desc);
}