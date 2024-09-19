/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
export { intercept, getVirtualPropertyValue, setVirtualPropertyValue, getOwnShadowPrototypeOf, registerShadowPrototype } from "./intercept";
export { interceptFunction, getFunctionInterceptor } from "./FunctionInterceptor";
export { interceptMethod } from "./MethodInterceptor";
export { interceptConstructor, interceptConstructorMethod } from "./ConstructorInterceptor";
export * as IRequire from "./IRequire";
export * as IPromise from "./IPromise";
export * as IGlobalThis from "./IGlobalThis";
