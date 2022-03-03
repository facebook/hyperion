import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
const unknownFunc = function () {
    console.warn('Unknown or missing function called! ');
};
class OnArgsFilter extends Hook {
}
class OnArgsObserver extends Hook {
}
class OnValueFilter extends Hook {
}
class OnValueObserver extends Hook {
}
export class FunctionInterceptorBase extends PropertyInterceptor {
    onArgsFilter;
    onArgsObserver;
    onValueFilter;
    onValueObserver;
    original;
    interceptor;
    dispatcherFunc;
    constructor(name, originalFunc = unknownFunc) {
        super(name);
        const that = this;
        this.interceptor = function () {
            return that.dispatcherFunc.apply(this, arguments);
        };
        this.original = originalFunc;
        this.dispatcherFunc = this.original; // By default just pass on to original
    }
    setOriginal(originalFunc) {
        this.original = originalFunc;
        this.updateDispatcherFunc();
    }
    static dispatcherCtors = (() => {
        // type T = { "foo": InterceptableFunction };
        // const ctors: { [index: number]: (fi: FunctionInterceptor<"foo", T>) => Function } = {
        const ctors = {
            [0 /* Has_____________ */]: fi => fi.original,
            [1 /* Has___________VO */]: fi => function () {
                let result;
                result = fi.original.apply(this, arguments);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [2 /* Has________VF___ */]: fi => function () {
                let result;
                result = fi.original.apply(this, arguments);
                result = fi.onValueFilter.call.call(this, result);
                return result;
            },
            [3 /* Has________VF_VO */]: fi => function () {
                let result;
                result = fi.original.apply(this, arguments);
                result = fi.onValueFilter.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [4 /* Has____AO_______ */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                }
                return result;
            },
            [5 /* Has____AO_____VO */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [6 /* Has____AO__VF___ */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    result = fi.onValueFilter.call.call(this, result);
                }
                return result;
            },
            [7 /* Has____AO__VF_VO */]: fi => function () {
                let result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    result = fi.onValueFilter.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [8 /* Has_AF__________ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                return result;
            },
            [9 /* Has_AF________VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [10 /* Has_AF_____VF___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                result = fi.onValueFilter.call.call(this, result);
                return result;
            },
            [11 /* Has_AF_____VF_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                result = fi.onValueFilter.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            },
            [12 /* Has_AF_AO_______ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                }
                return result;
            },
            [13 /* Has_AF_AO_____VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
            [14 /* Has_AF_AO__VF___ */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    result = fi.onValueFilter.call.call(this, result);
                }
                return result;
            },
            [15 /* Has_AF_AO__VF_VO */]: fi => function () {
                let result;
                const filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    result = fi.onValueFilter.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            },
        };
        if (__DEV__) {
            // just to make sure we caovered all cases correctly
            for (let i = 8 /* HasArgsFilter */ | 4 /* HasArgsObserver */ | 2 /* HasValueFilter */ | 1 /* HasValueObserver */; i >= 0; --i) {
                const ctor = ctors[i];
                assert(!!ctor, `unhandled interceptor state ${i}`);
                ctors[i] = fi => {
                    assert((i & 8 /* HasArgsFilter */) === 0 || !!fi.onArgsFilter, `missing expected .onArgsFilter for state ${i}`);
                    assert((i & 4 /* HasArgsObserver */) === 0 || !!fi.onArgsObserver, `missing expected .onArgsObserver for state ${i}`);
                    assert((i & 2 /* HasValueFilter */) === 0 || !!fi.onValueFilter, `missing expected .onValueFilter for state ${i}`);
                    assert((i & 1 /* HasValueObserver */) === 0 || !!fi.onValueObserver, `missing expected .onValueObserver for state ${i}`);
                    return ctor(fi);
                };
            }
        }
        return ctors;
    })();
    updateDispatcherFunc() {
        let state = 0;
        state |= this.onArgsFilter ? 8 /* HasArgsFilter */ : 0;
        state |= this.onArgsObserver ? 4 /* HasArgsObserver */ : 0;
        state |= this.onValueFilter ? 2 /* HasValueFilter */ : 0;
        state |= this.onValueObserver ? 1 /* HasValueObserver */ : 0;
        //TODO: Check a cached version first
        const dispatcherCtor = FunctionInterceptorBase.dispatcherCtors[state];
        assert(!!dispatcherCtor, `unhandled interceptor state ${state}`);
        this.dispatcherFunc = dispatcherCtor(this);
    }
    //#region helper function to lazily extend hooks
    onArgsFilterAdd(cb) {
        if (!this.onArgsFilter) {
            this.onArgsFilter = new OnArgsFilter();
            this.updateDispatcherFunc();
        }
        return this.onArgsFilter.add(cb);
    }
    onArgsFilterRemove(cb) {
        if (this.onArgsFilter?.remove(cb)) {
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
    onValueFilterAdd(cb) {
        if (!this.onValueFilter) {
            this.onValueFilter = new OnValueFilter();
            this.updateDispatcherFunc();
        }
        return this.onValueFilter.add(cb);
    }
    onValueFilterRemove(cb) {
        if (this.onValueFilter?.remove(cb)) {
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
        if (this.status !== 1 /* Intercepted */) {
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
                this.status = 1 /* Intercepted */;
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
                this.status = desc.configurable ? 1 /* Intercepted */ : 4 /* NotConfigurable */;
            }
            else {
                __DEV__ && assert(false, `unexpected situation! PropertyDescriptor does not have value or get/set!`);
            }
        }
        else {
            this.status = 2 /* NotFound */;
        }
    }
    interceptObjectOwnProperties(obj) {
        this.interceptProperty(obj, true);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25JbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZ1bmN0aW9uSW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0QyxPQUFPLEVBQUUsY0FBYyxFQUFFLDZCQUE2QixFQUFzQixtQkFBbUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBbUMvSCxNQUFNLFdBQVcsR0FBUTtJQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFBO0FBS0QsTUFBTSxZQUFxRCxTQUFRLElBQWdDO0NBQUk7QUFHdkcsTUFBTSxjQUF1RCxTQUFRLElBQWtDO0NBQUk7QUFHM0csTUFBTSxhQUFzRCxTQUFRLElBQWlDO0NBQUk7QUFHekcsTUFBTSxlQUF3RCxTQUFRLElBQW1DO0NBQUk7QUFFN0csTUFBTSxPQUFPLHVCQUlULFNBQVEsbUJBQW1CO0lBQ25CLFlBQVksQ0FBMEI7SUFDdEMsY0FBYyxDQUE0QjtJQUMxQyxhQUFhLENBQTJCO0lBQ3hDLGVBQWUsQ0FBNkI7SUFFNUMsUUFBUSxDQUFXO0lBQ2IsV0FBVyxDQUFXO0lBQzlCLGNBQWMsQ0FBVztJQUVqQyxZQUFZLElBQVUsRUFBRSxlQUF5QixXQUFXO1FBQzFELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVaLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsV0FBVyxHQUFhO1lBQzNCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFPLFNBQVMsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQTtRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDO1FBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFB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