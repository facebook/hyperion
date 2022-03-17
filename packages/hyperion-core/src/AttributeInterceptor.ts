/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { FunctionInterceptorBase, InterceptableFunction } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, InterceptionStatus, PropertyInterceptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

export class AttributeInterceptorBase<
  BaseType extends { [key: string]: any },
  Name extends string,
  GetterType extends InterceptableFunction = (this: BaseType) => BaseType[Name],
  SetterType extends InterceptableFunction = (this: BaseType, value: BaseType[Name]) => void
  > extends PropertyInterceptor {
  public readonly getter: FunctionInterceptorBase<BaseType, Name, GetterType>;
  public readonly setter: FunctionInterceptorBase<BaseType, Name, SetterType>;

  constructor(name: Name, getter?: GetterType, setter?: SetterType) {
    super(name);

    this.getter = new FunctionInterceptorBase<BaseType, Name, GetterType>(name, getter);
    this.setter = new FunctionInterceptorBase<BaseType, Name, SetterType>(name, setter);

  }
}

export class AttributeInterceptor<
  BaseType extends { [key: string]: any },
  Name extends string,
  GetAttrType = BaseType[Name],
  SetAttrType = GetAttrType
  > extends AttributeInterceptorBase<
  BaseType,
  Name,
  (this: BaseType) => GetAttrType,
  (this: BaseType, value: SetAttrType) => void
  > {
  constructor(name: Name, shadowPrototype: ShadowPrototype<BaseType>) {
    super(name);

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
      if (desc.get || desc.set) {
        const { get, set } = desc;
        if (get) {
          this.getter.setOriginal(get);
          desc.get = this.getter.interceptor;
        }
        if (set) {
          this.setter.setOriginal(set);
          desc.set = this.setter.interceptor
        }
        __DEV__ && assert(desc.configurable, `Cannot intercept attribute ${this.name}`);
        defineProperty(desc.container, this.name, desc);
        if (__DEV__) {
          let desc = getExtendedPropertyDescriptor(obj, this.name);
          assert(desc?.get === this.getter.interceptor, `getter interceptor did not work`);
          assert(desc?.set === this.setter.interceptor, `setter interceptor did not work`);
        }
        this.status = desc.configurable ? InterceptionStatus.Intercepted : InterceptionStatus.NotConfigurable;
      } else if (desc.value) {
        //TODO: we should replace this one with get/set
        console.warn(`Property ${this.name} does not seem to be an attribute`);
        this.status = InterceptionStatus.NoGetterSetter;
      } else {
        if (__DEV__) {
          if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
            console.warn(`Un expected situation, attribute ${this.name} does not have getter/setter defined`);

          }
        }
      }
    } else {
      this.status = InterceptionStatus.NotFound;
    }
  }

  interceptObjectOwnProperties(obj: object) {
    return this.interceptProperty(obj, true);
  }

}