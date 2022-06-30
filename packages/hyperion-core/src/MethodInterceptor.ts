/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { FunctionInterceptor, InterceptableFunction, InterceptableObjectType } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, InterceptionStatus } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

export class MethodInterceptor<
  Name extends string,
  T extends InterceptableObjectType,
  FuncType extends InterceptableFunction = (this: T, ...args: Parameters<T[Name]>) => ReturnType<T[Name]>
  >
  extends FunctionInterceptor<T, Name, FuncType>  {

  constructor(name: Name, shadowPrototype: ShadowPrototype<T>, interceptOutput: boolean = false) {
    super(name, void 0, interceptOutput);

    this.interceptProperty(shadowPrototype.targetPrototype, false);

    if (this.status !== InterceptionStatus.Intercepted) {
      shadowPrototype.addPendingPropertyInterceptor(this);
    }
  }

  private interceptProperty(obj: object, isOwnProperty: boolean) {
    let desc = getExtendedPropertyDescriptor(obj, this.name);
    if (isOwnProperty) {
      let virtualProperty: any; // TODO: we should do this on the object itself
      if (desc) {
        if (desc.value && desc.writable) { // it has value and can change
          virtualProperty = desc.value;
          delete desc.value;
          delete desc.writable;
          desc.get = function () { return virtualProperty; };
          desc.set = function (value) { virtualProperty = value; }
          desc.configurable = true;
        }
      } else {
        desc = {
          get: function () { return virtualProperty; },
          set: function (value) { virtualProperty = value; },
          enumerable: true,
          configurable: true,
          container: obj
        };
      }
    }

    if (desc) {
      if (desc.value) {
        this.setOriginal(desc.value);
        desc.value = this.interceptor;
        defineProperty(desc.container, this.name, desc);
        this.status = InterceptionStatus.Intercepted;
      } else if (desc.get || desc.set) {
        const that = this;
        const { get, set } = desc;
        if (get) {
          desc.get = function () {
            const originalFunc = get.call(this);
            if (typeof originalFunc !== "function") {
              return originalFunc; // getter didn't return a func, should maintain that!
            }
            if (originalFunc !== that.interceptor) {
              that.setOriginal(originalFunc);
            }
            return that.interceptor;
          };
        }
        if (set) {
          desc.set = function (value) {
            // set.call(this, value);
            set.call(this, that.interceptor);
            if (value !== that.interceptor && value !== that.original) {
              that.setOriginal(value);
            }
            return that.interceptor;
          }
        }
        defineProperty(desc.container, this.name, desc);
        this.status = desc.configurable ? InterceptionStatus.Intercepted : InterceptionStatus.NotConfigurable;
      } else {
        __DEV__ && assert(false, `unexpected situation! PropertyDescriptor does not have value or get/set!`);
      }
    } else {
      this.status = InterceptionStatus.NotFound;
    }

  }

  interceptObjectOwnProperties(obj: object) {
    this.interceptProperty(obj, true);
  }
}

export function interceptMethod<
  Name extends string,
  BaseType extends InterceptableObjectType,
  FuncType extends InterceptableFunction = (this: BaseType, ...args: Parameters<BaseType[Name]>) => ReturnType<BaseType[Name]>
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>,
  interceptOutput: boolean = false
): FunctionInterceptor<BaseType, Name, FuncType> {
  return new MethodInterceptor(name, shadowPrototype, interceptOutput);
}