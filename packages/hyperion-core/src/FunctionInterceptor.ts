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
  HasArgsMapper = 1 << 3,
  HasArgsObserver = 1 << 2,
  HasValueMapper = 1 << 1,
  HasValueObserver = 1 << 0,

  /**
   * The following is the list of all possibilities to be handled
   * They are organized to form 0, 1, ..., 15 values
   * */
  Has_____________ = 0 | 0 | 0 | 0,
  Has___________VO = 0 | 0 | 0 | HasValueObserver,
  Has________VF___ = 0 | 0 | HasValueMapper | 0,
  Has________VF_VO = 0 | 0 | HasValueMapper | HasValueObserver,
  Has____AO_______ = 0 | HasArgsObserver | 0 | 0,
  Has____AO_____VO = 0 | HasArgsObserver | 0 | HasValueObserver,
  Has____AO__VF___ = 0 | HasArgsObserver | HasValueMapper | 0,
  Has____AO__VF_VO = 0 | HasArgsObserver | HasValueMapper | HasValueObserver,
  Has_AF__________ = HasArgsMapper | 0 | 0 | 0,
  Has_AF________VO = HasArgsMapper | 0 | 0 | HasValueObserver,
  Has_AF_____VF___ = HasArgsMapper | 0 | HasValueMapper | 0,
  Has_AF_____VF_VO = HasArgsMapper | 0 | HasValueMapper | HasValueObserver,
  Has_AF_AO_______ = HasArgsMapper | HasArgsObserver | 0 | 0,
  Has_AF_AO_____VO = HasArgsMapper | HasArgsObserver | 0 | HasValueObserver,
  Has_AF_AO__VF___ = HasArgsMapper | HasArgsObserver | HasValueMapper | 0,
  Has_AF_AO__VF_VO = HasArgsMapper | HasArgsObserver | HasValueMapper | HasValueObserver,
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

export class FunctionInterceptor<
  BaseType,
  Name extends string,
  FuncType extends InterceptableFunction
> extends PropertyInterceptor {
  protected onArgsMapper?: OnArgsMapper<FuncType>;
  protected onArgsObserver?: OnArgsObserver<FuncType>;
  protected onValueMapper?: OnValueMapper<FuncType>;
  protected onValueObserver?: OnValueObserver<FuncType>;

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
      [InterceptorState.Has_____________]: fi => fi.customFunc ?? fi.original,

      [InterceptorState.Has___________VO]: fi => function (this: any) {
        let result;
        result = fi.implementation.apply(this, <any>arguments);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has________VF___]: fi => function (this: any) {
        let result;
        result = fi.implementation.apply(this, <any>arguments);
        result = fi.onValueMapper!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has________VF_VO]: fi => function (this: any) {
        let result;
        result = fi.implementation.apply(this, <any>arguments);
        result = fi.onValueMapper!.call.call(this, result);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has____AO_______]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
        }
        return result;
      },

      [InterceptorState.Has____AO_____VO]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has____AO__VF___]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
          result = fi.onValueMapper!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has____AO__VF_VO]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.implementation.apply(this, <any>arguments);
          result = fi.onValueMapper!.call.call(this, result);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AF__________]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        return result;
      },

      [InterceptorState.Has_AF________VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_AF_____VF___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        result = fi.onValueMapper!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_AF_____VF_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        result = fi.implementation.apply(this, filteredArgs);
        result = fi.onValueMapper!.call.call(this, result);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_AF_AO_______]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
        }
        return result;
      },

      [InterceptorState.Has_AF_AO_____VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AF_AO__VF___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
          result = fi.onValueMapper!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AF_AO__VF_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsMapper!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.implementation.apply(this, filteredArgs);
          result = fi.onValueMapper!.call.call(this, result);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

    };
    if (__DEV__) {
      // just to make sure we caovered all cases correctly
      for (let i = InterceptorState.HasArgsMapper | InterceptorState.HasArgsObserver | InterceptorState.HasValueMapper | InterceptorState.HasValueObserver; i >= 0; --i) {
        const ctor = ctors[i];
        assert(!!ctor, `unhandled interceptor state ${i}`);
        ctors[i] = fi => {
          assert((i & InterceptorState.HasArgsMapper) === 0 || !!fi.onArgsMapper, `missing expected .onArgsFilter for state ${i}`);
          assert((i & InterceptorState.HasArgsObserver) === 0 || !!fi.onArgsObserver, `missing expected .onArgsObserver for state ${i}`);
          assert((i & InterceptorState.HasValueMapper) === 0 || !!fi.onValueMapper, `missing expected .onValueFilter for state ${i}`);
          assert((i & InterceptorState.HasValueObserver) === 0 || !!fi.onValueObserver, `missing expected .onValueObserver for state ${i}`);
          return ctor(fi);
        }
      }
    }
    return ctors;
  })();


  private updateDispatcherFunc() {
    let state = 0;
    state |= this.onArgsMapper ? InterceptorState.HasArgsMapper : 0;
    state |= this.onArgsObserver ? InterceptorState.HasArgsObserver : 0;
    state |= this.onValueMapper ? InterceptorState.HasValueMapper : 0;
    state |= this.onValueObserver ? InterceptorState.HasValueObserver : 0;
    //TODO: Check a cached version first
    const dispatcherCtor = FunctionInterceptor.dispatcherCtors[state];
    assert(!!dispatcherCtor, `unhandled interceptor state ${state}`);
    this.dispatcherFunc = <FuncType>dispatcherCtor(this);
  }

  //#region helper function to lazily extend hooks
  public onArgsMapperAdd(cb: OnArgsMapperFunc<FuncType>): typeof cb {
    if (!this.onArgsMapper) {
      this.onArgsMapper = new OnArgsMapper<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onArgsMapper.add(cb);
  }
  public onArgsMapperRemove(cb: OnArgsMapperFunc<FuncType>): typeof cb {
    if (this.onArgsMapper?.remove(cb)) {
      this.updateDispatcherFunc();
    }
    return cb
  }

  public onArgsObserverAdd(cb: OnArgsObserverFunc<FuncType>): typeof cb {
    if (!this.onArgsObserver) {
      this.onArgsObserver = new OnArgsObserver<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onArgsObserver.add(cb);
  }
  public onArgsObserverRemove(cb: OnArgsObserverFunc<FuncType>): typeof cb {
    if (this.onArgsObserver?.remove(cb)) {
      this.updateDispatcherFunc();
    }
    return cb
  }

  public onValueMapperAdd(cb: OnValueMapperFunc<FuncType>): typeof cb {
    if (!this.onValueMapper) {
      this.onValueMapper = new OnValueMapper<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onValueMapper.add(cb);
  }
  public onValueMapperRemove(cb: OnValueMapperFunc<FuncType>): typeof cb {
    if (this.onValueMapper?.remove(cb)) {
      this.updateDispatcherFunc();
    }
    return cb
  }

  public onValueObserverAdd(cb: OnValueObserverFunc<FuncType>): typeof cb {
    if (!this.onValueObserver) {
      this.onValueObserver = new OnValueObserver<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onValueObserver.add(cb);
  }
  public onValueObserverRemove(cb: OnValueObserverFunc<FuncType>): typeof cb {
    if (this.onValueObserver?.remove(cb)) {
      this.updateDispatcherFunc();
    }
    return cb
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
}

type ExtendedFuncType<FuncType extends InterceptableFunction> =
  FuncType &
  { [FuncExtensionPropName]?: GenericFunctionInterceptor<ExtendedFuncType<FuncType>> };

export type GenericFunctionInterceptor<FuncType extends InterceptableFunction> =
  FunctionInterceptor<FuncThisType<FuncType>, string, FuncType> &
  { [index: string]: any };

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
