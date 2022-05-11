/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { InterceptableFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { GenericFunctionInterceptor, interceptFunction } from "@hyperion/hyperion-core/src/intercept";
// import { DOMShadowPrototype } from "./DOMShadowPrototype";

// export const IEventListenertPrototype = new DOMShadowPrototype<EventListenerObject, Object>(null, null);
// export const handleEvent = new FunctionInterceptor('handleEvent', IEventListenertPrototype);

export type CallbackType = EventListenerOrEventListenerObject | EventListener | InterceptableFunction;
type FuncTypeOf<T extends CallbackType> = T extends EventListenerObject ? EventListenerObject['handleEvent'] : T;

type EventListenerFunctionInterceptor<FuncType extends InterceptableFunction> = GenericFunctionInterceptor<FuncType>;

export function isEventListenerObject(func: CallbackType): func is EventListenerObject {
  return typeof func === "object" && typeof func.handleEvent == "function";
}

export function interceptEventListener<T extends CallbackType>(listener: T): EventListenerFunctionInterceptor<FuncTypeOf<T>> {
  let funcInterceptor;
  if (isEventListenerObject(listener)) {
    funcInterceptor = interceptFunction(listener.handleEvent);
    listener.handleEvent = funcInterceptor.interceptor;
  } else {
    funcInterceptor = interceptFunction(listener);
  }
  return <EventListenerFunctionInterceptor<FuncTypeOf<T>>>funcInterceptor;
}