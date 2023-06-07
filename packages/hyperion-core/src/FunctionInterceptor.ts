/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { intercept } from "./intercept";
import { copyOwnProperties, PropertyInterceptor } from "./PropertyInterceptor";

const FuncExtensionPropName = "__ext";

// One-hot coding for state of the interceptor
const enum InterceptorState {
  HasArgsAndValueMapper = 1 << 4,
  HasArgsMapper = 1 << 3,
  HasArgsObserver = 1 << 2,
  HasValueMapper = 1 << 1,
  HasValueObserver = 1 << 0,

  /**
   * The following is the list of all possibilities to be handled
   * They are organized to form 0, 1, ..., 15 values
   * */
  Has_________________ = 0 | 0 | 0 | 0 | 0,
  Has_______________VO = 0 | 0 | 0 | 0 | HasValueObserver,
  Has____________VM___ = 0 | 0 | 0 | HasValueMapper | 0,
  Has____________VM_VO = 0 | 0 | 0 | HasValueMapper | HasValueObserver,
  Has________AO_______ = 0 | 0 | HasArgsObserver | 0 | 0,
  Has________AO_____VO = 0 | 0 | HasArgsObserver | 0 | HasValueObserver,
  Has________AO__VM___ = 0 | 0 | HasArgsObserver | HasValueMapper | 0,
  Has________AO__VM_VO = 0 | 0 | HasArgsObserver | HasValueMapper | HasValueObserver,
  Has_____AM__________ = 0 | HasArgsMapper | 0 | 0 | 0,
  Has_____AM________VO = 0 | HasArgsMapper | 0 | 0 | HasValueObserver,
  Has_____AM_____VM___ = 0 | HasArgsMapper | 0 | HasValueMapper | 0,
  Has_____AM_____VM_VO = 0 | HasArgsMapper | 0 | HasValueMapper | HasValueObserver,
  Has_____AM_AO_______ = 0 | HasArgsMapper | HasArgsObserver | 0 | 0,
  Has_____AM_AO_____VO = 0 | HasArgsMapper | HasArgsObserver | 0 | HasValueObserver,
  Has_____AM_AO__VM___ = 0 | HasArgsMapper | HasArgsObserver | HasValueMapper | 0,
  Has_____AM_AO__VM_VO = 0 | HasArgsMapper | HasArgsObserver | HasValueMapper | HasValueObserver,
  Has_AVM______________ = HasArgsAndValueMapper | 0 | 0 | 0 | 0,
  Has_AVM____________VO = HasArgsAndValueMapper | 0 | 0 | 0 | HasValueObserver,
  Has_AVM_________VM___ = HasArgsAndValueMapper | 0 | 0 | HasValueMapper | 0,
  Has_AVM_________VM_VO = HasArgsAndValueMapper | 0 | 0 | HasValueMapper | HasValueObserver,
  Has_AVM_____AO_______ = HasArgsAndValueMapper | 0 | HasArgsObserver | 0 | 0,
  Has_AVM_____AO_____VO = HasArgsAndValueMapper | 0 | HasArgsObserver | 0 | HasValueObserver,
  Has_AVM_____AO__VM___ = HasArgsAndValueMapper | 0 | HasArgsObserver | HasValueMapper | 0,
  Has_AVM_____AO__VM_VO = HasArgsAndValueMapper | 0 | HasArgsObserver | HasValueMapper | HasValueObserver,
  Has_AVM__AM__________ = HasArgsAndValueMapper | HasArgsMapper | 0 | 0 | 0,
  Has_AVM__AM________VO = HasArgsAndValueMapper | HasArgsMapper | 0 | 0 | HasValueObserver,
  Has_AVM__AM_____VM___ = HasArgsAndValueMapper | HasArgsMapper | 0 | HasValueMapper | 0,
  Has_AVM__AM_____VM_VO = HasArgsAndValueMapper | HasArgsMapper | 0 | HasValueMapper | HasValueObserver,
  Has_AVM__AM_AO_______ = HasArgsAndValueMapper | HasArgsMapper | HasArgsObserver | 0 | 0,
  Has_AVM__AM_AO_____VO = HasArgsAndValueMapper | HasArgsMapper | HasArgsObserver | 0 | HasValueObserver,
  Has_AVM__AM_AO__VM___ = HasArgsAndValueMapper | HasArgsMapper | HasArgsObserver | HasValueMapper | 0,
  Has_AVM__AM_AO__VM_VO = HasArgsAndValueMapper | HasArgsMapper | HasArgsObserver | HasValueMapper | HasValueObserver,
}

export type InterceptableConstructor = abstract new (...args: any) => any
type InterceptableMethod = ((this: any, ...args: any) => any);
export type InterceptableFunction = InterceptableMethod | InterceptableConstructor | Function;
export type InterceptableObjectType = { [key: string]: InterceptableFunction | any };

const unknownFunc: any = function () {
  console.warn('Unknown or missing function called! ');
}

export type FuncThisType<T extends InterceptableFunction> =
  T extends (this: infer U, ...arg: any) => any ? U :
  T extends InterceptableConstructor ? never :
  T extends Function ? Function :
  {};

type FuncParameters<T extends InterceptableFunction> =
  T extends InterceptableMethod ? Parameters<T> :
  T extends InterceptableConstructor ? ConstructorParameters<T> :
  never;

type FuncReturnType<T extends InterceptableFunction> =
  T extends InterceptableMethod ? ReturnType<T> :
  T extends InterceptableConstructor ? InstanceType<T> :
  never;

type OnArgsMapperFunc<FuncType extends InterceptableFunction> = ((this: FuncThisType<FuncType>, args: FuncParameters<FuncType>) => FuncParameters<FuncType>)
class OnArgsMapper<FuncType extends InterceptableFunction> extends Hook<OnArgsMapperFunc<FuncType>> {
  protected createMultiCallbackCall(callbacks: OnArgsMapperFunc<FuncType>[]): OnArgsMapperFunc<FuncType> {
    return function (this, args) {
      let result = args;
      for (let i = 0, len = callbacks.length; i < len; ++i) {
        result = callbacks[i].call(this, result);
      }
      return result;
    }
  }
}

type OnArgsObserverFunc<FuncType extends InterceptableFunction> = (this: FuncThisType<FuncType>, ...args: FuncParameters<FuncType>) => void | boolean | undefined;
class OnArgsObserver<FuncType extends InterceptableFunction> extends Hook<OnArgsObserverFunc<FuncType>> {
  protected createMultiCallbackCall(callbacks: OnArgsObserverFunc<FuncType>[]): OnArgsObserverFunc<FuncType> {
    return function (this): boolean {
      let skipApi = false;
      for (let i = 0, len = callbacks.length; i < len; ++i) {
        const cb = callbacks[i];
        /**
         * If any of the callbacks return true (truthy), then we should skip
         * calling the original function.
         * However, we want to ensure we call of the callbacks and hence should
         * avoid short circuting the loop.
         */
        skipApi = cb.apply(this, <any>arguments) || skipApi;
      }
      return skipApi;
    }
  }
}

type OnValueMapperFunc<FuncType extends InterceptableFunction> = (this: FuncThisType<FuncType>, value: FuncReturnType<FuncType>) => typeof value;
class OnValueMapper<FuncType extends InterceptableFunction> extends Hook<OnValueMapperFunc<FuncType>> {
  protected createMultiCallbackCall(callbacks: OnValueMapperFunc<FuncType>[]): OnValueMapperFunc<FuncType> {
    return function (this, value) {
      let result = value;
      for (let i = 0, len = callbacks.length; i < len; ++i) {
        result = callbacks[i].call(this, result);
      }
      return result;
    }
  }
}

type OnValueObserverFunc<FuncType extends InterceptableFunction> = (this: FuncThisType<FuncType>, value: FuncReturnType<FuncType>) => void;
class OnValueObserver<FuncType extends InterceptableFunction> extends Hook<OnValueObserverFunc<FuncType>> { }

type OnArgsAndValueMapperFunc<FuncType extends InterceptableFunction> = (this: FuncThisType<FuncType>, args: FuncParameters<FuncType>) => OnValueMapperFunc<FuncType>;
class OnArgsAndValueMapper<FuncType extends InterceptableFunction> extends Hook<OnArgsAndValueMapperFunc<FuncType>> {
  protected createMultiCallbackCall(callbacks: OnArgsAndValueMapperFunc<FuncType>[]): OnArgsAndValueMapperFunc<FuncType> {
    return function (this): OnValueMapperFunc<FuncType> {
      const onValueMappers: OnValueMapperFunc<FuncType>[] = [];
      for (let i = 0, len = callbacks.length; i < len; ++i) {
        const cb = callbacks[i];
        onValueMappers.push(cb.apply(this, <any>arguments));
      }
      return (function (this, value: FuncReturnType<FuncType>): typeof value {
        let result = value;
        for (let i = 0, len = onValueMappers.length; i < len; ++i) {
          const cb = onValueMappers[i];
          result = cb.call(this, result);
        }
        return result;
      });
    }
  }
}


export class FunctionInterceptor<
  BaseType,
  Name extends string,
  FuncType extends InterceptableFunction
> extends PropertyInterceptor {
  protected onBeforeCallArgsMapper?: OnArgsMapper<FuncType> | null;
  protected onBeforeCallArgsObserver?: OnArgsObserver<FuncType> | null;
  protected onAfterReturnValueMapper?: OnValueMapper<FuncType> | null;
  protected onAfterReturnValueObserver?: OnValueObserver<FuncType> | null;
  protected onBeforeCallArgsAndReturnValueMapper?: OnArgsAndValueMapper<FuncType> | null;

  protected original: FuncType = unknownFunc;
  private customFunc?: FuncType;
  private implementation: FuncType; // usually either the .original or the .customFunc

  public readonly interceptor: FuncType;
  private dispatcherFunc: FuncType;

  /**
   * The following allows the users of this class add additional information to the instances.
   * One common usecase is checking if certain aspect is added via various callback mechanisms.
   */
  private data?: { [index: string | symbol]: any };

  constructor(name: Name, originalFunc: FuncType = unknownFunc, interceptOutput: boolean = false) {
    super(name);

    const that = this;
    // In all cases we are dealing with methods, we handle constructors separately.
    // It is too cumbersome (and perf inefficient) to separate classes for methods and constructors.
    // TODO: is there a runtime check we can do to ensure this? e.g. checking func.prototype? Some constructors are functions too! 
    this.interceptor = !interceptOutput
      ? <FuncType>function (this: BaseType) {
        const result = (<InterceptableMethod>(that.dispatcherFunc)).apply(this, <any>arguments);
        return result;
      }
      : <FuncType>function (this: BaseType) {
        const result = (<InterceptableMethod>(that.dispatcherFunc)).apply(this, <any>arguments);
        return intercept(result);
      }
      ;
    setFunctionInterceptor(this.interceptor, this);
    this.implementation = originalFunc;
    this.dispatcherFunc = this.original; // By default just pass on to original
    this.setOriginal(originalFunc); // to perform any extra bookkeeping
  }

  public getOriginal(): FuncType {
    return this.original;
  }

  public setOriginal(originalFunc: FuncType) {
    if (this.original === originalFunc) {
      return; // not much left to do
    }

    this.original = originalFunc;
    if (!this.customFunc) {
      // If no custom function is set, the implementation should point to original function
      this.implementation = originalFunc;
    }

    /**
     * We should make interceptor look as much like the original as possible.
     * This includes {.name, .prototype, .toString(), ...}
     * Note that copyOwnProperties will skip properties that destination already has
     * therefore we might have to copy some properties manually
     */
    copyOwnProperties(originalFunc, this.interceptor, true);
    setFunctionInterceptor(originalFunc, this);
    this.updateDispatcherFunc();
  }

  public setCustom(customFunc: FuncType) {
    // Once we have custom implementation, we chose that from that point on
    __DEV__ && assert(!this.customFunc, `There is already a custom function assigned to ${this.name}`);
    this.customFunc = customFunc;
    this.implementation = customFunc;
    this.updateDispatcherFunc();
  }

  private static dispatcherCtors = (() => {
    // type T = { "foo": InterceptableFunction };
    // const ctors: { [index: number]: (fi: FunctionInterceptor<"foo", T>) => Function } = {
    const ctors: { [index: number]: <FI extends FunctionInterceptor<any, any, any>>(fi: FI) => Function } = {
      [InterceptorState.Has_________________]: fi => fi.customFunc ?? fi.original,

      [InterceptorState.Has_______________VO]: fi => function (this: any) {
        let result;
        result = fi.implementation.apply(this, <any>arguments);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has____________VM___]: fi => function (this: any) {
        let result;
        result = fi.implementation.apply(this, <any>arguments);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has____________VM_VO]: fi => function (this: any) {
        let result;
        result = fi.implementation.apply(this, <any>arguments);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has________AO_______]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
        }
        return result;
      },

      [InterceptorState.Has________AO_____VO]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
          fi.onAfterReturnValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has________AO__VM___]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has________AO__VM_VO]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
          fi.onAfterReturnValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_____AM__________]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        return result;
      },

      [InterceptorState.Has_____AM________VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_____AM_____VM___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_____AM_____VM_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_____AM_AO_______]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
        }
        return result;
      },

      [InterceptorState.Has_____AM_AO_____VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
          fi.onAfterReturnValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_____AM_AO__VM___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_____AM_AO__VM_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
          fi.onAfterReturnValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM______________]: fi => function (this: any) {
        let result;
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, <any>arguments);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM____________VO]: fi => function (this: any) {
        let result;
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, <any>arguments);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM_________VM___]: fi => function (this: any) {
        let result;
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, <any>arguments);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM_________VM_VO]: fi => function (this: any) {
        let result;
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, <any>arguments);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM_____AO_______]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, <any>arguments);
          result = onValueMapper.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM_____AO_____VO]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, <any>arguments);
          fi.onAfterReturnValueObserver!.call.call(this, result);
          result = onValueMapper.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM_____AO__VM___]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, <any>arguments);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
          result = onValueMapper.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM_____AO__VM_VO]: fi => function (this: any) {
        let result;
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, <any>arguments)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, <any>arguments);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
          fi.onAfterReturnValueObserver!.call.call(this, result);
          result = onValueMapper.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM__AM__________]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, filteredArgs);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM__AM________VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, filteredArgs);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM__AM_____VM___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, filteredArgs);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM__AM_____VM_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
        result = fi.implementation.apply(this, filteredArgs);
        result = fi.onAfterReturnValueMapper!.call.call(this, result);
        fi.onAfterReturnValueObserver!.call.call(this, result);
        result = onValueMapper.call(this, result);
        return result;
      },

      [InterceptorState.Has_AVM__AM_AO_______]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, filteredArgs);
          result = onValueMapper.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM__AM_AO_____VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, filteredArgs);
          fi.onAfterReturnValueObserver!.call.call(this, result);
          result = onValueMapper.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM__AM_AO__VM___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, filteredArgs);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
          result = onValueMapper.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AVM__AM_AO__VM_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onBeforeCallArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onBeforeCallArgsObserver!.call.apply(this, filteredArgs)) {
          const onValueMapper = fi.onBeforeCallArgsAndReturnValueMapper!.call.call(this, <any>arguments);
          result = fi.implementation.apply(this, filteredArgs);
          result = fi.onAfterReturnValueMapper!.call.call(this, result);
          fi.onAfterReturnValueObserver!.call.call(this, result);
          result = onValueMapper.call(this, result);
        }
        return result;
      },
    };
    if (__DEV__) {
      // just to make sure we caovered all cases correctly
      for (
        let i = InterceptorState.HasArgsMapper | InterceptorState.HasArgsObserver | InterceptorState.HasValueMapper | InterceptorState.HasValueObserver | InterceptorState.HasArgsAndValueMapper;
        i >= 0;
        --i
      ) {
        const ctor = ctors[i];
        assert(!!ctor, `unhandled interceptor state ${i}`);
        ctors[i] = fi => {
          assert((i & InterceptorState.HasArgsMapper) === 0 || !!fi.onBeforeCallArgsMapper, `missing expected .onArgsFilter for state ${i}`);
          assert((i & InterceptorState.HasArgsObserver) === 0 || !!fi.onBeforeCallArgsObserver, `missing expected .onArgsObserver for state ${i}`);
          assert((i & InterceptorState.HasValueMapper) === 0 || !!fi.onAfterReturnValueMapper, `missing expected .onValueFilter for state ${i}`);
          assert((i & InterceptorState.HasValueObserver) === 0 || !!fi.onAfterReturnValueObserver, `missing expected .onValueObserver for state ${i}`);
          assert((i & InterceptorState.HasArgsAndValueMapper) === 0 || !!fi.onBeforeCallArgsAndReturnValueMapper, `missing expected .onArgsAndValueMapper for state ${i}`);
          return ctor(fi);
        }
      }
    }
    return ctors;
  })();


  private updateDispatcherFunc() {
    let state = 0;
    state |= this.onBeforeCallArgsMapper ? InterceptorState.HasArgsMapper : 0;
    state |= this.onBeforeCallArgsObserver ? InterceptorState.HasArgsObserver : 0;
    state |= this.onAfterReturnValueMapper ? InterceptorState.HasValueMapper : 0;
    state |= this.onAfterReturnValueObserver ? InterceptorState.HasValueObserver : 0;
    state |= this.onBeforeCallArgsAndReturnValueMapper ? InterceptorState.HasArgsAndValueMapper : 0;
    //TODO: Check a cached version first
    const dispatcherCtor = FunctionInterceptor.dispatcherCtors[state];
    assert(!!dispatcherCtor, `unhandled interceptor state ${state}`);
    this.dispatcherFunc = <FuncType>dispatcherCtor(this);
  }

  //#region helper function to lazily extend hooks
  public onBeforeCallArgsMapperAdd(cb: OnArgsMapperFunc<FuncType>): typeof cb {
    if (!this.onBeforeCallArgsMapper) {
      this.onBeforeCallArgsMapper = new OnArgsMapper<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onBeforeCallArgsMapper.add(cb);
  }
  public onBeforeCallArgsMapperRemove(cb: OnArgsMapperFunc<FuncType>): typeof cb {
    if (this.onBeforeCallArgsMapper?.remove(cb)) {
      // Since we rely on the output of the callback, we should avoid empty list
      if (!this.onBeforeCallArgsMapper.hasCallback()) {
        this.onBeforeCallArgsMapper = null;
      }
      this.updateDispatcherFunc();
    }
    return cb
  }

  public onBeforeCallArgsObserverAdd(cb: OnArgsObserverFunc<FuncType>): typeof cb {
    if (!this.onBeforeCallArgsObserver) {
      this.onBeforeCallArgsObserver = new OnArgsObserver<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onBeforeCallArgsObserver.add(cb);
  }
  public onBeforeCallArgsObserverRemove(cb: OnArgsObserverFunc<FuncType>): typeof cb {
    if (this.onBeforeCallArgsObserver?.remove(cb)) {
      // Since we rely on the output of the callback, we should avoid empty list
      if (!this.onBeforeCallArgsObserver.hasCallback()) {
        this.onBeforeCallArgsObserver = null;
      }
      this.updateDispatcherFunc();
    }
    return cb
  }

  public onAfterReturnValueMapperAdd(cb: OnValueMapperFunc<FuncType>): typeof cb {
    if (!this.onAfterReturnValueMapper) {
      this.onAfterReturnValueMapper = new OnValueMapper<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onAfterReturnValueMapper.add(cb);
  }
  public onAfterReturnValueMapperRemove(cb: OnValueMapperFunc<FuncType>): typeof cb {
    if (this.onAfterReturnValueMapper?.remove(cb)) {
      // Since we rely on the output of the callback, we should avoid empty list
      if (!this.onAfterReturnValueMapper.hasCallback()) {
        this.onAfterReturnValueMapper = null;
      }
      this.updateDispatcherFunc();
    }
    return cb
  }

  public onAfterReturnValueObserverAdd(cb: OnValueObserverFunc<FuncType>): typeof cb {
    if (!this.onAfterReturnValueObserver) {
      this.onAfterReturnValueObserver = new OnValueObserver<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onAfterReturnValueObserver.add(cb);
  }
  public onAfterReturnValueObserverRemove(cb: OnValueObserverFunc<FuncType>): typeof cb {
    if (this.onAfterReturnValueObserver?.remove(cb)) {
      this.updateDispatcherFunc();
    }
    return cb
  }

  public onBeforeCallArgsAndAfterReturnValueMapperAdd(cb: OnArgsAndValueMapperFunc<FuncType>): typeof cb {
    if (!this.onBeforeCallArgsAndReturnValueMapper) {
      this.onBeforeCallArgsAndReturnValueMapper = new OnArgsAndValueMapper<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onBeforeCallArgsAndReturnValueMapper.add(cb);
  }
  public onBeforeCallArgsAndAfterReturnValueMapperRemove(cb: OnArgsAndValueMapperFunc<FuncType>): typeof cb {
    if (this.onBeforeCallArgsAndReturnValueMapper?.remove(cb)) {
      // Since we rely on the output of the callback, we should avoid empty list
      if (!this.onBeforeCallArgsAndReturnValueMapper.hasCallback()) {
        this.onBeforeCallArgsAndReturnValueMapper = null;
      }
      this.updateDispatcherFunc();
    }
    return cb;
  }
  //#endregion

  public getData<T>(dataPropName: string): T | undefined {
    return this.data?.[dataPropName];
  }
  public setData<T>(dataPropName: string, value: T) {
    if (!this.data) {
      this.data = {};
    }
    this.data[dataPropName] = value;
  }
  public testAndSet(dataPropName: string): boolean {
    const currValue = this.getData<boolean>(dataPropName) || false;
    if (!currValue) {
      this.setData<boolean>(dataPropName, true);
    }
    return currValue;
  }
}

type ExtendedFuncType<FuncType extends InterceptableFunction> =
  FuncType &
  { [FuncExtensionPropName]?: GenericFunctionInterceptor<ExtendedFuncType<FuncType>> };

export type GenericFunctionInterceptor<FuncType extends InterceptableFunction> =
  FunctionInterceptor<FuncThisType<FuncType>, string, FuncType>
// & { [index: string]: any };

export function getFunctionInterceptor<FuncType extends InterceptableFunction>(
  func: ExtendedFuncType<FuncType> | null | undefined
): GenericFunctionInterceptor<FuncType> | null | undefined {
  return func?.[FuncExtensionPropName];
}
export function setFunctionInterceptor<FuncType extends InterceptableFunction>(
  func: ExtendedFuncType<FuncType>,
  funcInterceptor: GenericFunctionInterceptor<ExtendedFuncType<FuncType>>
) {
  __DEV__ && assert(
    typeof func === "function" &&
    !getFunctionInterceptor(func), `Function already has an interceptor assigned to it`,
    { logger: { error() { debugger; } } }
  );
  func[FuncExtensionPropName] = funcInterceptor;
}

export function interceptFunction<FuncType extends InterceptableFunction>(
  func: ExtendedFuncType<FuncType>,
  interceptOutput: boolean = false,
  fiCtor?: null | (new (name: string, originalFunc: FuncType, interceptOutput?: boolean) => GenericFunctionInterceptor<ExtendedFuncType<FuncType>>),
  name: string = `_annonymous`
): GenericFunctionInterceptor<FuncType> {
  assert(typeof func === "function", `cannot intercept non-function input`);
  let funcInterceptor = getFunctionInterceptor(func);
  if (!funcInterceptor) {
    funcInterceptor = fiCtor
      ? new fiCtor(name, func, interceptOutput)
      : new FunctionInterceptor(name, func, interceptOutput);
  }
  return funcInterceptor;
}
