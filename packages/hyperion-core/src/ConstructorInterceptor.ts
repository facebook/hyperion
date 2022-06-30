/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { FunctionInterceptor, InterceptableObjectType } from "./FunctionInterceptor";
import { intercept } from "./intercept";
import { MethodInterceptor } from "./MethodInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

class ConstructorMethodInterceptor<
  Name extends string,
  T extends InterceptableObjectType,
  FuncType extends { new(...args: any): any; } = { new(...args: ConstructorParameters<T[Name]>): T; }
  > extends MethodInterceptor<Name, T, FuncType> {
  private ctorInterceptor: FuncType | null = null;
  constructor(name: Name, shadowPrototype: ShadowPrototype<T>) {
    super(name, shadowPrototype/* , true */); //If we intercept constructor, that means we want the output to be intercepted
  }

  public setOriginal(originalFunc: FuncType) {
    const ctorFunc = originalFunc;
    this.ctorInterceptor = <FuncType><unknown>function () {
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
      return intercept(result);
    }
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

  return new ConstructorMethodInterceptor<Name, BaseType, FuncType>(name, shadowPrototype);
}