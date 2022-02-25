import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { defineProperty, getExtendedPropertyDescriptor, InterceptionStatus, PropertyInterceptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

// One-hot coding for state of the interceptor
const enum InterceptorState {
  HasArgsFilter = 1 << 3,
  HasArgsObserver = 1 << 2,
  HasValueFilter = 1 << 1,
  HasValueObserver = 1 << 0,

  /**
   * The following is the list of all possibilities to be handled
   * They are organized to form 0, 1, ..., 15 values
   * */
  Has_____________ = 0 | 0 | 0 | 0,
  Has___________VO = 0 | 0 | 0 | HasValueObserver,
  Has________VF___ = 0 | 0 | HasValueFilter | 0,
  Has________VF_VO = 0 | 0 | HasValueFilter | HasValueObserver,
  Has____AO_______ = 0 | HasArgsObserver | 0 | 0,
  Has____AO_____VO = 0 | HasArgsObserver | 0 | HasValueObserver,
  Has____AO__VF___ = 0 | HasArgsObserver | HasValueFilter | 0,
  Has____AO__VF_VO = 0 | HasArgsObserver | HasValueFilter | HasValueObserver,
  Has_AF__________ = HasArgsFilter | 0 | 0 | 0,
  Has_AF________VO = HasArgsFilter | 0 | 0 | HasValueObserver,
  Has_AF_____VF___ = HasArgsFilter | 0 | HasValueFilter | 0,
  Has_AF_____VF_VO = HasArgsFilter | 0 | HasValueFilter | HasValueObserver,
  Has_AF_AO_______ = HasArgsFilter | HasArgsObserver | 0 | 0,
  Has_AF_AO_____VO = HasArgsFilter | HasArgsObserver | 0 | HasValueObserver,
  Has_AF_AO__VF___ = HasArgsFilter | HasArgsObserver | HasValueFilter | 0,
  Has_AF_AO__VF_VO = HasArgsFilter | HasArgsObserver | HasValueFilter | HasValueObserver,
}

type InterceptableFunction = (this: any, ...args: any) => any | { new(...args: any): any };
type InterceptableObjectType = { [key: string]: InterceptableFunction | any };

const unknownFunc: any = function () {
  console.warn('Unknown or missing function called! ');
}

type ThisType<T extends InterceptableFunction> = T extends (this: infer U, ...arg: any) => any ? U : {};

type OnArgsFilterFunc<FuncType extends InterceptableFunction> = (this: ThisType<FuncType>, args: Parameters<FuncType>) => Parameters<FuncType>;
class OnArgsFilter<FuncType extends InterceptableFunction> extends Hook<OnArgsFilterFunc<FuncType>> { }

type OnArgsObserverFunc<FuncType extends InterceptableFunction> = (this: ThisType<FuncType>, ...args: Parameters<FuncType>) => void | boolean | undefined;
class OnArgsObserver<FuncType extends InterceptableFunction> extends Hook<OnArgsObserverFunc<FuncType>> { }

type OnValueFilterFunc<FuncType extends InterceptableFunction> = (value: ReturnType<FuncType>) => typeof value;
class OnValueFilter<FuncType extends InterceptableFunction> extends Hook<OnValueFilterFunc<FuncType>> { }

type OnValueObserverFunc<FuncType extends InterceptableFunction> = (value: ReturnType<FuncType>) => void;
class OnValueObserver<FuncType extends InterceptableFunction> extends Hook<OnValueObserverFunc<FuncType>> { }

type FullFuncType<T extends InterceptableObjectType, Name extends string> = (this: T, ...args: Parameters<T[Name]>) => ReturnType<T[Name]>;

export class FunctionInterceptorBase<
  BaseType,
  Name extends string,
  FuncType extends InterceptableFunction
  > extends PropertyInterceptor {
  protected onArgsFilter?: OnArgsFilter<FuncType>;
  protected onArgsObserver?: OnArgsObserver<FuncType>;
  protected onValueFilter?: OnValueFilter<FuncType>;
  protected onValueObserver?: OnValueObserver<FuncType>;

  protected original: FuncType;
  public readonly interceptor: FuncType;
  private dispatcherFunc: FuncType;

  constructor(name: Name, originalFunc: FuncType = unknownFunc) {
    super(name);

    const that = this;
    this.interceptor = <FuncType>function (this: BaseType) {
      return that.dispatcherFunc.apply(this, <any>arguments);
    }
    this.original = originalFunc;
    this.dispatcherFunc = this.original; // By default just pass on to original
  }

  public setOriginal(originalFunc: FuncType) {
    this.original = originalFunc;
    this.updateDispatcherFunc();
  }

  private static dispatcherCtors = (() => {
    // type T = { "foo": InterceptableFunction };
    // const ctors: { [index: number]: (fi: FunctionInterceptor<"foo", T>) => Function } = {
    const ctors: { [index: number]: <FI extends FunctionInterceptorBase<any, any, any>>(fi: FI) => Function } = {
      [InterceptorState.Has_____________]: fi => fi.original,

      [InterceptorState.Has___________VO]: fi => function (this: any) {
        let result;
        result = fi.original.apply(this, <any>arguments);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has________VF___]: fi => function (this: any) {
        let result;
        result = fi.original.apply(this, <any>arguments);
        result = fi.onValueFilter!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has________VF_VO]: fi => function (this: any) {
        let result;
        result = fi.original.apply(this, <any>arguments);
        result = fi.onValueFilter!.call.call(this, result);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has____AO_______]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.original.apply(this, <any>arguments);
        }
        return result;
      },

      [InterceptorState.Has____AO_____VO]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.original.apply(this, <any>arguments);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has____AO__VF___]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.original.apply(this, <any>arguments);
          result = fi.onValueFilter!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has____AO__VF_VO]: fi => function (this: any) {
        let result;
        if (!fi.onArgsObserver!.call.apply(this, <any>arguments)) {
          result = fi.original.apply(this, <any>arguments);
          result = fi.onValueFilter!.call.call(this, result);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AF__________]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        result = fi.original.apply(this, filteredArgs);
        return result;
      },

      [InterceptorState.Has_AF________VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        result = fi.original.apply(this, filteredArgs);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_AF_____VF___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        result = fi.original.apply(this, filteredArgs);
        result = fi.onValueFilter!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_AF_____VF_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        result = fi.original.apply(this, filteredArgs);
        result = fi.onValueFilter!.call.call(this, result);
        fi.onValueObserver!.call.call(this, result);
        return result;
      },

      [InterceptorState.Has_AF_AO_______]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.original.apply(this, filteredArgs);
        }
        return result;
      },

      [InterceptorState.Has_AF_AO_____VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.original.apply(this, filteredArgs);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AF_AO__VF___]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.original.apply(this, filteredArgs);
          result = fi.onValueFilter!.call.call(this, result);
        }
        return result;
      },

      [InterceptorState.Has_AF_AO__VF_VO]: fi => function (this: any) {
        let result;
        const filteredArgs = fi.onArgsFilter!.call.call(this, <any>arguments); //Pass as an array
        if (!fi.onArgsObserver!.call.apply(this, filteredArgs)) {
          result = fi.original.apply(this, filteredArgs);
          result = fi.onValueFilter!.call.call(this, result);
          fi.onValueObserver!.call.call(this, result);
        }
        return result;
      },

    };
    if (__DEV__) {
      // just to make sure we caovered all cases correctly
      for (let i = InterceptorState.HasArgsFilter | InterceptorState.HasArgsObserver | InterceptorState.HasValueFilter | InterceptorState.HasValueObserver; i >= 0; --i) {
        const ctor = ctors[i];
        assert(!!ctor, `unhandled interceptor state ${i}`);
        ctors[i] = fi => {
          assert((i & InterceptorState.HasArgsFilter) === 0 || !!fi.onArgsFilter, `missing expected .onArgsFilter for state ${i}`);
          assert((i & InterceptorState.HasArgsObserver) === 0 || !!fi.onArgsObserver, `missing expected .onArgsObserver for state ${i}`);
          assert((i & InterceptorState.HasValueFilter) === 0 || !!fi.onValueFilter, `missing expected .onValueFilter for state ${i}`);
          assert((i & InterceptorState.HasValueObserver) === 0 || !!fi.onValueObserver, `missing expected .onValueObserver for state ${i}`);
          return ctor(fi);
        }
      }
    }
    return ctors;
  })();


  private updateDispatcherFunc() {
    let state = 0;
    state |= this.onArgsFilter ? InterceptorState.HasArgsFilter : 0;
    state |= this.onArgsObserver ? InterceptorState.HasArgsObserver : 0;
    state |= this.onValueFilter ? InterceptorState.HasValueFilter : 0;
    state |= this.onValueObserver ? InterceptorState.HasValueObserver : 0;
    //TODO: Check a cached version first
    const dispatcherCtor = FunctionInterceptorBase.dispatcherCtors[state];
    assert(!!dispatcherCtor, `unhandled interceptor state ${state}`);
    this.dispatcherFunc = <FuncType>dispatcherCtor(this);
  }

  //#region helper function to lazily extend hooks
  public onArgsFilterAdd(cb: OnArgsFilterFunc<FuncType>): typeof cb {
    if (!this.onArgsFilter) {
      this.onArgsFilter = new OnArgsFilter<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onArgsFilter.add(cb);
  }
  public onArgsFilterRemove(cb: OnArgsFilterFunc<FuncType>): typeof cb {
    if (this.onArgsFilter?.remove(cb)) {
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

  public onValueFilterAdd(cb: OnValueFilterFunc<FuncType>): typeof cb {
    if (!this.onValueFilter) {
      this.onValueFilter = new OnValueFilter<FuncType>();
      this.updateDispatcherFunc();
    }
    return this.onValueFilter.add(cb);
  }
  public onValueFilterRemove(cb: OnValueFilterFunc<FuncType>): typeof cb {
    if (this.onValueFilter?.remove(cb)) {
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

export class FunctionInterceptor<Name extends string, T extends InterceptableObjectType>
  extends FunctionInterceptorBase<T, Name, FullFuncType<T, Name>>  {

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
