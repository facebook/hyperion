/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor } from "@hyperion/hyperion-core/src/AttributeInterceptor";

export class EventHandlerAttributeInterceptor<
  BaseType extends EventTarget & { [key: string]: any },
  Name extends string,
  > extends AttributeInterceptor<BaseType, Name> {

}