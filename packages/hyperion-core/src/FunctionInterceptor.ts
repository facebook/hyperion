/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { copyOwnProperties, defineProperty, getExtendedPropertyDescriptor, InterceptionStatus, PropertyInterceptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

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
class OnArgsMapper<FuncType extends InterceptableFunction> extends Hook<OnArgsMapperFunc<FuncType>> { }

type OnArgsObserverFunc<FuncType extends InterceptableFunction> = (this: FuncThisType<FuncType>, ...args: FuncParameters<FuncType>) => void | boolean | undefined;
class OnArgsObserver<FuncType extends InterceptableFunction> extends Hook<OnArgsObserverFunc<FuncType>> { }

type OnValueMapperFunc<FuncType extends InterceptableFunction> = (this: FuncThisType<FuncType>, value: FuncReturnType<FuncType>) => typeof value;
class OnValueMapper<FuncType extends InterceptableFunction> extends Hook<OnValueMapperFunc<FuncType>> { }

type OnValueObserverFunc<FuncType extends InterceptableFunction> = (this: FuncThisType<FuncType>, value: FuncReturnType<FuncType>) => void;
class OnValueObserver<FuncType extends InterceptableFunction> extends Hook<OnValueObserverFunc<FuncType>> { }

export class FunctionInterceptorBase<
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

  constructor(name: Name, originalFunc: FuncType = unknownFunc) {
    super(name);

    const that = this;
    this.interceptor = <FuncType>function (this: BaseType) {
      // In all cases we are dealing with methods, we handle constructors separately.
      // It is too cumbersome (and perf inefficient) to separate classes for methods and constructors.
      // TODO: is there a runtime check we can do to ensure this? e.g. checking func.prototype? Some constructors are functions too! 
      return (<InterceptableMethod>(that.dispatcherFunc)).apply(this, <any>arguments);
    };
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
    copyOwnProperties(originalFunc, this.interceptor);
    this.interceptor.toString = function () {
      return originalFunc.toString();
    };


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
    const ctors: { [index: number]: <FI extends FunctionInterceptorBase<any, any, any>>(fi: FI) => Function } = {
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
    const dispatcherCtor = FunctionInterceptorBase.dispatcherCtors[state];
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
}

export class FunctionInterceptor<
  Name extends string,
  T extends InterceptableObjectType,
  FuncType extends InterceptableFunction = (this: T, ...args: Parameters<T[Name]>) => ReturnType<T[Name]>
  >
  extends FunctionInterceptorBase<T, Name, FuncType>  {

  constructor(name: Name, shadowPrototype: ShadowPrototype<T>) {
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
