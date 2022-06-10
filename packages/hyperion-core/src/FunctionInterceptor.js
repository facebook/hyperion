/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { copyOwnProperties, defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
const unknownFunc = function () {
    console.warn('Unknown or missing function called! ');
};
class OnArgsMapper extends Hook {
}
class OnArgsObserver extends Hook {
}
class OnValueMapper extends Hook {
}
class OnValueObserver extends Hook {
}
export class FunctionInterceptorBase extends PropertyInterceptor {
    onArgsMapper;
    onArgsObserver;
    onValueMapper;
    onValueObserver;
    original = unknownFunc;
    customFunc;
    implementation; // usually either the .original or the .customFunc
    interceptor;
    dispatcherFunc;
    constructor(name, originalFunc = unknownFunc) {
        super(name);
        const that = this;
        this.interceptor = function () {
            // In all cases we are dealing with methods, we handle constructors separately.
            // It is too cumbersome (and perf inefficient) to separate classes for methods and constructors.
            // TODO: is there a runtime check we can do to ensure this? e.g. checking func.prototype? Some constructors are functions too! 
            return (that.dispatcherFunc).apply(this, arguments);
        };
        this.implementation = originalFunc;
        this.dispatcherFunc = this.original; // By default just pass on to original
        this.setOriginal(originalFunc); // to perform any extra bookkeeping
    }
    getOriginal() {
        return this.original;
    }
    setOriginal(originalFunc) {
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
    setCustom(customFunc) {
        // Once we have custom implementation, we chose that from that point on
        __DEV__ && assert(!this.customFunc, `There is already a custom function assigned to ${this.name}`);
        this.customFunc = customFunc;
        this.implementation = customFunc;
        this.updateDispatcherFunc();
    }
    static dispatcherCtors = (() => {
        // type T = { "foo": InterceptableFunction };
        // const ctors: { [index: number]: (fi: FunctionInterceptor<"foo", T>) => Function } = {
        const ctors = {
            [0 /* InterceptorState.Has_____________ */]: fi => fi.customFunc ?? fi.original,
            [1 /* InterceptorState.Has___________VO */]: fi => function () {
                let result;
                result = fi.implementation.apply(this, arguments);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [2 /* InterceptorState.Has________VF___ */]: fi => function () {
                let result;
                result = fi.implementation.apply(this, arguments);
                result = fi.onValueMapper.call.call(this, result);
                return result;
            },
            [3 /* InterceptorState.Has________VF_VO */]: fi => function () {
                let result;
                result = fi.implementation.apply(this, arguments);
                result = fi.onValueMapper.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [4 /* InterceptorState.Has____AO_______ */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                }
                return result;
            },
            [5 /* InterceptorState.Has____AO_____VO */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [6 /* InterceptorState.Has____AO__VF___ */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                    result = fi.onValueMapper.call.call(this, result);
                }
                return result;
            },
            [7 /* InterceptorState.Has____AO__VF_VO */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.implementation.apply(this, arguments);
                    result = fi.onValueMapper.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [8 /* InterceptorState.Has_AF__________ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                return result;
            },
            [9 /* InterceptorState.Has_AF________VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [10 /* InterceptorState.Has_AF_____VF___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                result = fi.onValueMapper.call.call(this, result);
                return result;
            },
            [11 /* InterceptorState.Has_AF_____VF_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                result = fi.implementation.apply(this, filteredArgs);
                result = fi.onValueMapper.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [12 /* InterceptorState.Has_AF_AO_______ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                }
                return result;
            },
            [13 /* InterceptorState.Has_AF_AO_____VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [14 /* InterceptorState.Has_AF_AO__VF___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                    result = fi.onValueMapper.call.call(this, result);
                }
                return result;
            },
            [15 /* InterceptorState.Has_AF_AO__VF_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsMapper.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.implementation.apply(this, filteredArgs);
                    result = fi.onValueMapper.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
        };
        if (__DEV__) {
            // just to make sure we caovered all cases correctly
            for (let i = 8 /* InterceptorState.HasArgsMapper */ | 4 /* InterceptorState.HasArgsObserver */ | 2 /* InterceptorState.HasValueMapper */ | 1 /* InterceptorState.HasValueObserver */; i >= 0; --i) {
                const ctor = ctors[i];
                assert(!!ctor, `unhandled interceptor state ${i}`);
                ctors[i] = fi => {
                    assert((i & 8 /* InterceptorState.HasArgsMapper */) === 0 || !!fi.onArgsMapper, `missing expected .onArgsFilter for state ${i}`);
                    assert((i & 4 /* InterceptorState.HasArgsObserver */) === 0 || !!fi.onArgsObserver, `missing expected .onArgsObserver for state ${i}`);
                    assert((i & 2 /* InterceptorState.HasValueMapper */) === 0 || !!fi.onValueMapper, `missing expected .onValueFilter for state ${i}`);
                    assert((i & 1 /* InterceptorState.HasValueObserver */) === 0 || !!fi.onValueObserver, `missing expected .onValueObserver for state ${i}`);
                    return ctor(fi);
                };
            }
        }
        return ctors;
    })();
    updateDispatcherFunc() {
        let state = 0;
        state |= this.onArgsMapper ? 8 /* InterceptorState.HasArgsMapper */ : 0;
        state |= this.onArgsObserver ? 4 /* InterceptorState.HasArgsObserver */ : 0;
        state |= this.onValueMapper ? 2 /* InterceptorState.HasValueMapper */ : 0;
        state |= this.onValueObserver ? 1 /* InterceptorState.HasValueObserver */ : 0;
        //TODO: Check a cached version first
        const dispatcherCtor = FunctionInterceptorBase.dispatcherCtors[state];
        assert(!!dispatcherCtor, `unhandled interceptor state ${state}`);
        this.dispatcherFunc = dispatcherCtor(this);
    }
    //#region helper function to lazily extend hooks
    onArgsMapperAdd(cb) {
        if (!this.onArgsMapper) {
            this.onArgsMapper = new OnArgsMapper();
            this.updateDispatcherFunc();
        }
        return this.onArgsMapper.add(cb);
    }
    onArgsMapperRemove(cb) {
        if (this.onArgsMapper?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onArgsObserverAdd(cb) {
        if (!this.onArgsObserver) {
            this.onArgsObserver = new OnArgsObserver();
            this.updateDispatcherFunc();
        }
        return this.onArgsObserver.add(cb);
    }
    onArgsObserverRemove(cb) {
        if (this.onArgsObserver?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onValueMapperAdd(cb) {
        if (!this.onValueMapper) {
            this.onValueMapper = new OnValueMapper();
            this.updateDispatcherFunc();
        }
        return this.onValueMapper.add(cb);
    }
    onValueMapperRemove(cb) {
        if (this.onValueMapper?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
    onValueObserverAdd(cb) {
        if (!this.onValueObserver) {
            this.onValueObserver = new OnValueObserver();
            this.updateDispatcherFunc();
        }
        return this.onValueObserver.add(cb);
    }
    onValueObserverRemove(cb) {
        if (this.onValueObserver?.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    }
}
export class FunctionInterceptor extends FunctionInterceptorBase {
    constructor(name, shadowPrototype) {
        super(name);
        this.interceptProperty(shadowPrototype.targetPrototype, false);
        if (this.status !== 1 /* InterceptionStatus.Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(this);
        }
    }
    interceptProperty(obj, isOwnProperty) {
        let desc = getExtendedPropertyDescriptor(obj, this.name);
        if (isOwnProperty) {
            let virtualProperty; // TODO: we should do this on the object itself
            if (desc) {
                if (desc.value && desc.writable) { // it has value and can change
                    virtualProperty = desc.value;
                    delete desc.value;
                    delete desc.writable;
                    desc.get = function () { return virtualProperty; };
                    desc.set = function (value) { virtualProperty = value; };
                    desc.configurable = true;
                }
            }
            else {
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
                this.status = 1 /* InterceptionStatus.Intercepted */;
            }
            else if (desc.get || desc.set) {
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
                    };
                }
                defineProperty(desc.container, this.name, desc);
                this.status = desc.configurable ? 1 /* InterceptionStatus.Intercepted */ : 4 /* InterceptionStatus.NotConfigurable */;
            }
            else {
                __DEV__ && assert(false, `unexpected situation! PropertyDescriptor does not have value or get/set!`);
            }
        }
        else {
            this.status = 2 /* InterceptionStatus.NotFound */;
        }
    }
    interceptObjectOwnProperties(obj) {
        this.interceptProperty(obj, true);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25JbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZ1bmN0aW9uSW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsNkJBQTZCLEVBQXNCLG1CQUFtQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFxQ2xKLE1BQU0sV0FBVyxHQUFRO0lBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUE7QUFtQkQsTUFBTSxZQUFxRCxTQUFRLElBQWdDO0NBQUk7QUFHdkcsTUFBTSxjQUF1RCxTQUFRLElBQWtDO0NBQUk7QUFHM0csTUFBTSxhQUFzRCxTQUFRLElBQWlDO0NBQUk7QUFHekcsTUFBTSxlQUF3RCxTQUFRLElBQW1DO0NBQUk7QUFFN0csTUFBTSxPQUFPLHVCQUlULFNBQVEsbUJBQW1CO0lBQ25CLFlBQVksQ0FBMEI7SUFDdEMsY0FBYyxDQUE0QjtJQUMxQyxhQUFhLENBQTJCO0lBQ3hDLGVBQWUsQ0FBNkI7SUFFNUMsUUFBUSxHQUFhLFdBQVcsQ0FBQztJQUNuQyxVQUFVLENBQVk7SUFDdEIsY0FBYyxDQUFXLENBQUMsa0RBQWtEO0lBRXBFLFdBQVcsQ0FBVztJQUM5QixjQUFjLENBQVc7SUFFakMsWUFBWSxJQUFVLEVBQUUsZUFBeUIsV0FBVztRQUMxRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFWixNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBYTtZQUMzQiwrRUFBK0U7WUFDL0UsZ0dBQWdHO1lBQ2hHLCtIQUErSDtZQUMvSCxPQUE2QixDQUFDLElBQUksQ0FBQyxj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