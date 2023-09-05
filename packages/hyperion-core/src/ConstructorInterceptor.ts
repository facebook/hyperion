/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { FunctionInterceptor, InterceptableObjectType, interceptFunction } from "./FunctionInterceptor";
import { getMethodInterceptor, MethodInterceptor } from "./MethodInterceptor";
import { copyOwnProperties, ExtendedPropertyDescriptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

function createCtorInterceptor<
  BaseType extends InterceptableObjectType,
  FuncType extends { new(...args: any): BaseType; }
>(ctorFunc: FuncType): FuncType {
  const ctorInterceptor = <FuncType><unknown>function () {
    // let result = new ctorFunc(...arguments);
    // return result;
    // NOTE: if we see some browsers may not support ...argument, we should then try the following
    let result;
    switch (arguments.length) {
      case 0: result = new ctorFunc(); break;
      case 1: result = new ctorFunc(arguments[0]); break;
      case 2: result = new ctorFunc(arguments[0], arguments[1]); break;
      case 3: result = new ctorFunc(arguments[0], arguments[1], arguments[2]); break;
      case 4: result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3]); break;
      case 5: result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]); break;
      case 6: result = new ctorFunc(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]); break;
      default: throw "Unsupported case!";
    }
    return result;
  };
  copyOwnProperties(ctorFunc, ctorInterceptor, true);
  return ctorInterceptor;
}

class ConstructorInterceptor<
  BaseType extends InterceptableObjectType,
  Name extends string,
  FuncType extends { new(...args: any): BaseType; } = { new(...args: ConstructorParameters<BaseType[Name]>): BaseType; }
> extends FunctionInterceptor<BaseType, Name, FuncType> {
  private ctorInterceptor: FuncType | null = null;
  constructor(name: Name, originalCtor: FuncType) {
    super(name, originalCtor, true); //If we intercept constructor, that means we want the output to be intercepted
  }

  public setOriginal(originalFunc: FuncType) {
    this.ctorInterceptor = createCtorInterceptor(originalFunc);
    return super.setOriginal(this.ctorInterceptor);
  }
}

export function interceptConstructor<
  BaseType extends InterceptableObjectType,
  FuncType extends { new(...args: any): BaseType; }
>(
  ctor: FuncType,
  name: string = `_annonymousCtor`
): FunctionInterceptor<BaseType, string, FuncType> {
  return interceptFunction<FuncType>(ctor, true, ConstructorInterceptor, name);
}

class ConstructorMethodInterceptor<
  Name extends string,
  T extends InterceptableObjectType,
  FuncType extends { new(...args: any): any; } = { new(...args: ConstructorParameters<T[Name]>): T; }
> extends MethodInterceptor<Name, T, FuncType> {
  private ctorInterceptor: FuncType | null = null;
  constructor(name: Name, shadowPrototype: ShadowPrototype<T>, desc?: ExtendedPropertyDescriptor) {
    super(name, shadowPrototype, true, desc); //If we intercept constructor, that means we want the output to be intercepted
  }

  public setOriginal(originalFunc: FuncType) {
    this.ctorInterceptor = createCtorInterceptor(originalFunc);
    return super.setOriginal(this.ctorInterceptor);
  }
}

export function interceptConstructorMethod<
  Name extends string,
  BaseType extends InterceptableObjectType,
  FuncType extends { new(...args: any): any; } = { new(...args: ConstructorParameters<BaseType[Name]>): BaseType; }
>(name: Name,
  shadowPrototype: ShadowPrototype<BaseType>,
): FunctionInterceptor<BaseType, Name, FuncType> {
  const desc = getMethodInterceptor<Name, BaseType, FuncType>(name, shadowPrototype);
  return desc?.interceptor ?? new ConstructorMethodInterceptor<Name, BaseType, FuncType>(name, shadowPrototype, desc);
}