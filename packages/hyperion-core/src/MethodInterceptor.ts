/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "hyperion-globals";
import { FunctionInterceptor, getFunctionInterceptor, InterceptableFunction, InterceptableObjectType, setFunctionInterceptor } from "./FunctionInterceptor";
import { defineProperty, ExtendedPropertyDescriptor, getExtendedPropertyDescriptor, InterceptionStatus } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

export class MethodInterceptor<
  Name extends string,
  T extends InterceptableObjectType,
  FuncType extends InterceptableFunction = (this: T, ...args: Parameters<T[Name]>) => ReturnType<T[Name]>
>
  extends FunctionInterceptor<T, Name, FuncType>  {

  constructor(name: Name, shadowPrototype: ShadowPrototype<T>, interceptOutput: boolean = false, desc?: ExtendedPropertyDescriptor) {
    super(name, void 0, interceptOutput);

    this.interceptProperty(shadowPrototype.targetPrototype, false, desc);

    if (this.status !== InterceptionStatus.Intercepted) {
      shadowPrototype.addPendingPropertyInterceptor(this);
    }
  }

  private interceptProperty(obj: object, isOwnProperty: boolean, desc?: ExtendedPropertyDescriptor) {
    desc = desc ?? getExtendedPropertyDescriptor(obj, this.name);
    if (isOwnProperty) {
      let virtualProperty: any; // TODO: we should do this on the object itself
      if (desc) {
        if (desc.writable && (desc.value || desc.hasOwnProperty("value"))) { // it has value and can change
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
          setFunctionInterceptor(desc.get, <any>that);
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
          setFunctionInterceptor(desc.set, <any>that);
        }
        defineProperty(desc.container, this.name, desc);
        this.status = desc.configurable ? InterceptionStatus.Intercepted : InterceptionStatus.NotConfigurable;
      } else if (desc.hasOwnProperty("value")) {
        /**
         * There was a .value = null on the prototype chain. We can assume this value will not change and just
         * ignore it.
         * We could also treat this just like the (isOwnProperty && desc.hasOwnProperty('value')) above, but
         * that does not seem to provide any value.
         * Also, since this is supposed to be a function, we would not expect other falsy values here (i.e. "", 0, ...)
         * Only null would be fine
         *  */
        __DEV__ && assert(desc.value === null, `unexpected situation! PropertyDescriptor.value must be function or null!`);
        this.status = InterceptionStatus.Intercepted;
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

export function getMethodInterceptor<
  Name extends string,
  BaseType extends InterceptableObjectType,
  FuncType extends InterceptableFunction = (this: BaseType, ...args: Parameters<BaseType[Name]>) => ReturnType<BaseType[Name]>,
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>,
): ExtendedPropertyDescriptor<FunctionInterceptor<BaseType[Name], Name, FuncType>> | undefined {
  type FuncInterceptorType = FunctionInterceptor<BaseType[Name], Name, FuncType>;

  const desc = getExtendedPropertyDescriptor<FuncInterceptorType>(shadowPrototype.targetPrototype, name);
  let fi: FuncInterceptorType | undefined | null;
  if (desc) {
    fi = getFunctionInterceptor<FuncType>(desc.value);
    if (!fi) {
      /**
       * let's try getter/setter as well.
       * we know this is special case (see above) and interceptor is really about the actual func, not its getter/setters
       * so, we need to supress the type of getter/setter
       */
      const getFI = getFunctionInterceptor<FuncType>(<any>desc.get);
      const setFI = getFunctionInterceptor<FuncType>(<any>desc.set);
      assert(!(getFI && setFI) || (getFI === setFI), `Getter/Setter of method ${name} have differnt interceptors`);
      fi = getFI ?? setFI;
    }
    desc.interceptor = fi;
  }
  return desc;
}

export function interceptMethod<
  Name extends string,
  BaseType extends InterceptableObjectType,
  FuncType extends InterceptableFunction = (this: BaseType, ...args: Parameters<BaseType[Name]>) => ReturnType<BaseType[Name]>
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>,
  interceptOutput: boolean = false,
  miCtor?: null | (new (name: string, shadowPrototype: ShadowPrototype<BaseType>, interceptOutput?: boolean, desc?: ExtendedPropertyDescriptor) => MethodInterceptor<Name, BaseType, FuncType>),
): FunctionInterceptor<BaseType[Name], Name, FuncType> {
  const desc = getMethodInterceptor<Name, BaseType, FuncType>(name, shadowPrototype);
  return desc?.interceptor ?? new (miCtor ?? MethodInterceptor)(name, shadowPrototype, interceptOutput, desc);
}
