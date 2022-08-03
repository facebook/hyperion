/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { InterceptableFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { GenericFunctionInterceptor, interceptFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
// import { DOMShadowPrototype } from "./DOMShadowPrototype";

// export const IEventListenertPrototype = new DOMShadowPrototype<EventListenerObject, Object>(null, null);
// export const handleEvent = interceptMethod('handleEvent', IEventListenertPrototype);

export type CallbackType = EventListenerOrEventListenerObject | EventListener | InterceptableFunction;
type FuncTypeOf<T extends CallbackType> = T extends EventListenerObject ? EventListenerObject['handleEvent'] : T;

type EventListenerFunctionInterceptor<FuncType extends InterceptableFunction> = GenericFunctionInterceptor<FuncType>;

export function isEventListenerObject(func: CallbackType): func is EventListenerObject {
  return typeof func === "object" && (!func.handleEvent || typeof func.handleEvent == "function");
}

export function interceptEventListener<T extends CallbackType>(listener: T | undefined | null): EventListenerFunctionInterceptor<FuncTypeOf<T>> | null | undefined {
  let funcInterceptor;
  if (!listener) {
    return;
  }

  if (isEventListenerObject(listener)) {
    if (listener.handleEvent) {
      funcInterceptor = interceptFunction(listener.handleEvent);
      listener.handleEvent = funcInterceptor.interceptor;
    }
  } else {
    funcInterceptor = interceptFunction(listener);
  }
  return <EventListenerFunctionInterceptor<FuncTypeOf<T>> | null | undefined>funcInterceptor;
}