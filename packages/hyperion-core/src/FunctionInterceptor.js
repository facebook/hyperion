import { __extends } from "tslib";
import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
var unknownFunc = function () {
    console.warn('Unknown or missing function called! ');
};
var OnArgsFilter = /** @class */ (function (_super) {
    __extends(OnArgsFilter, _super);
    function OnArgsFilter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OnArgsFilter;
}(Hook));
var OnArgsObserver = /** @class */ (function (_super) {
    __extends(OnArgsObserver, _super);
    function OnArgsObserver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OnArgsObserver;
}(Hook));
var OnValueFilter = /** @class */ (function (_super) {
    __extends(OnValueFilter, _super);
    function OnValueFilter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OnValueFilter;
}(Hook));
var OnValueObserver = /** @class */ (function (_super) {
    __extends(OnValueObserver, _super);
    function OnValueObserver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OnValueObserver;
}(Hook));
var FunctionInterceptorBase = /** @class */ (function (_super) {
    __extends(FunctionInterceptorBase, _super);
    function FunctionInterceptorBase(name, originalFunc) {
        if (originalFunc === void 0) { originalFunc = unknownFunc; }
        var _this = _super.call(this, name) || this;
        var that = _this;
        _this.interceptor = function () {
            return that.dispatcherFunc.apply(this, arguments);
        };
        _this.original = originalFunc;
        _this.dispatcherFunc = _this.original; // By default just pass on to original
        return _this;
    }
    FunctionInterceptorBase.prototype.setOriginal = function (originalFunc) {
        this.original = originalFunc;
        this.updateDispatcherFunc();
    };
    FunctionInterceptorBase.prototype.updateDispatcherFunc = function () {
        var state = 0;
        state |= this.onArgsFilter ? 8 /* HasArgsFilter */ : 0;
        state |= this.onArgsObserver ? 4 /* HasArgsObserver */ : 0;
        state |= this.onValueFilter ? 2 /* HasValueFilter */ : 0;
        state |= this.onValueObserver ? 1 /* HasValueObserver */ : 0;
        //TODO: Check a cached version first
        var dispatcherCtor = FunctionInterceptorBase.dispatcherCtors[state];
        assert(!!dispatcherCtor, "unhandled interceptor state " + state);
        this.dispatcherFunc = dispatcherCtor(this);
    };
    //#region helper function to lazily extend hooks
    FunctionInterceptorBase.prototype.onArgsFilterAdd = function (cb) {
        if (!this.onArgsFilter) {
            this.onArgsFilter = new OnArgsFilter();
            this.updateDispatcherFunc();
        }
        return this.onArgsFilter.add(cb);
    };
    FunctionInterceptorBase.prototype.onArgsFilterRemove = function (cb) {
        var _a;
        if ((_a = this.onArgsFilter) === null || _a === void 0 ? void 0 : _a.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    };
    FunctionInterceptorBase.prototype.onArgsObserverAdd = function (cb) {
        if (!this.onArgsObserver) {
            this.onArgsObserver = new OnArgsObserver();
            this.updateDispatcherFunc();
        }
        return this.onArgsObserver.add(cb);
    };
    FunctionInterceptorBase.prototype.onArgsObserverRemove = function (cb) {
        var _a;
        if ((_a = this.onArgsObserver) === null || _a === void 0 ? void 0 : _a.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    };
    FunctionInterceptorBase.prototype.onValueFilterAdd = function (cb) {
        if (!this.onValueFilter) {
            this.onValueFilter = new OnValueFilter();
            this.updateDispatcherFunc();
        }
        return this.onValueFilter.add(cb);
    };
    FunctionInterceptorBase.prototype.onValueFilterRemove = function (cb) {
        var _a;
        if ((_a = this.onValueFilter) === null || _a === void 0 ? void 0 : _a.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    };
    FunctionInterceptorBase.prototype.onValueObserverAdd = function (cb) {
        if (!this.onValueObserver) {
            this.onValueObserver = new OnValueObserver();
            this.updateDispatcherFunc();
        }
        return this.onValueObserver.add(cb);
    };
    FunctionInterceptorBase.prototype.onValueObserverRemove = function (cb) {
        var _a;
        if ((_a = this.onValueObserver) === null || _a === void 0 ? void 0 : _a.remove(cb)) {
            this.updateDispatcherFunc();
        }
        return cb;
    };
    FunctionInterceptorBase.dispatcherCtors = (function () {
        var _a;
        // type T = { "foo": InterceptableFunction };
        // const ctors: { [index: number]: (fi: FunctionInterceptor<"foo", T>) => Function } = {
        var ctors = (_a = {},
            _a[0 /* Has_____________ */] = function (fi) { return fi.original; },
            _a[1 /* Has___________VO */] = function (fi) { return function () {
                var result;
                result = fi.original.apply(this, arguments);
                fi.onValueObserver.call.call(this, result);
                return result;
            }; },
            _a[2 /* Has________VF___ */] = function (fi) { return function () {
                var result;
                result = fi.original.apply(this, arguments);
                result = fi.onValueFilter.call.call(this, result);
                return result;
            }; },
            _a[3 /* Has________VF_VO */] = function (fi) { return function () {
                var result;
                result = fi.original.apply(this, arguments);
                result = fi.onValueFilter.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            }; },
            _a[4 /* Has____AO_______ */] = function (fi) { return function () {
                var result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                }
                return result;
            }; },
            _a[5 /* Has____AO_____VO */] = function (fi) { return function () {
                var result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            }; },
            _a[6 /* Has____AO__VF___ */] = function (fi) { return function () {
                var result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    result = fi.onValueFilter.call.call(this, result);
                }
                return result;
            }; },
            _a[7 /* Has____AO__VF_VO */] = function (fi) { return function () {
                var result;
                if (!fi.onArgsObserver.call.apply(this, arguments)) {
                    result = fi.original.apply(this, arguments);
                    result = fi.onValueFilter.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            }; },
            _a[8 /* Has_AF__________ */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                return result;
            }; },
            _a[9 /* Has_AF________VO */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                fi.onValueObserver.call.call(this, result);
                return result;
            }; },
            _a[10 /* Has_AF_____VF___ */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                result = fi.onValueFilter.call.call(this, result);
                return result;
            }; },
            _a[11 /* Has_AF_____VF_VO */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                result = fi.original.apply(this, filteredArgs);
                result = fi.onValueFilter.call.call(this, result);
                fi.onValueObserver.call.call(this, result);
                return result;
            }; },
            _a[12 /* Has_AF_AO_______ */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                }
                return result;
            }; },
            _a[13 /* Has_AF_AO_____VO */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            }; },
            _a[14 /* Has_AF_AO__VF___ */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    result = fi.onValueFilter.call.call(this, result);
                }
                return result;
            }; },
            _a[15 /* Has_AF_AO__VF_VO */] = function (fi) { return function () {
                var result;
                var filteredArgs = fi.onArgsFilter.call.call(this, arguments); //Pass as an array
                if (!fi.onArgsObserver.call.apply(this, filteredArgs)) {
                    result = fi.original.apply(this, filteredArgs);
                    result = fi.onValueFilter.call.call(this, result);
                    fi.onValueObserver.call.call(this, result);
                }
                return result;
            }; },
            _a);
        if (__DEV__) {
            var _loop_1 = function (i) {
                var ctor = ctors[i];
                assert(!!ctor, "unhandled interceptor state " + i);
                ctors[i] = function (fi) {
                    assert((i & 8 /* HasArgsFilter */) === 0 || !!fi.onArgsFilter, "missing expected .onArgsFilter for state " + i);
                    assert((i & 4 /* HasArgsObserver */) === 0 || !!fi.onArgsObserver, "missing expected .onArgsObserver for state " + i);
                    assert((i & 2 /* HasValueFilter */) === 0 || !!fi.onValueFilter, "missing expected .onValueFilter for state " + i);
                    assert((i & 1 /* HasValueObserver */) === 0 || !!fi.onValueObserver, "missing expected .onValueObserver for state " + i);
                    return ctor(fi);
                };
            };
            // just to make sure we caovered all cases correctly
            for (var i = 8 /* HasArgsFilter */ | 4 /* HasArgsObserver */ | 2 /* HasValueFilter */ | 1 /* HasValueObserver */; i >= 0; --i) {
                _loop_1(i);
            }
        }
        return ctors;
    })();
    return FunctionInterceptorBase;
}(PropertyInterceptor));
export { FunctionInterceptorBase };
var FunctionInterceptor = /** @class */ (function (_super) {
    __extends(FunctionInterceptor, _super);
    function FunctionInterceptor(name, shadowPrototype) {
        var _this = _super.call(this, name) || this;
        _this.interceptProperty(shadowPrototype.targetPrototype, false);
        if (_this.status !== 1 /* Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(_this);
        }
        return _this;
    }
    FunctionInterceptor.prototype.interceptProperty = function (obj, isOwnProperty) {
        var desc = getExtendedPropertyDescriptor(obj, this.name);
        if (isOwnProperty) {
            var virtualProperty_1; // TODO: we should do this on the object itself
            if (desc) {
                if (desc.value && desc.writable) { // it has value and can change
                    virtualProperty_1 = desc.value;
                    delete desc.value;
                    delete desc.writable;
                    desc.get = function () { return virtualProperty_1; };
                    desc.set = function (value) { virtualProperty_1 = value; };
                    desc.configurable = true;
                }
            }
            else {
                desc = {
                    get: function () { return virtualProperty_1; },
                    set: function (value) { virtualProperty_1 = value; },
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
                var that_1 = this;
                var get_1 = desc.get, set_1 = desc.set;
                if (get_1) {
                    desc.get = function () {
                        var originalFunc = get_1.call(this);
                        if (originalFunc !== that_1.interceptor) {
                            that_1.setOriginal(originalFunc);
                        }
                        return that_1.interceptor;
                    };
                }
                if (set_1) {
                    desc.set = function (value) {
                        // set.call(this, value);
                        set_1.call(this, that_1.interceptor);
                        if (value !== that_1.interceptor && value !== that_1.original) {
                            that_1.setOriginal(value);
                        }
                        return that_1.interceptor;
                    };
                }
                defineProperty(desc.container, this.name, desc);
                this.status = desc.configurable ? 1 /* Intercepted */ : 4 /* NotConfigurable */;
            }
            else {
                __DEV__ && assert(false, "unexpected situation! PropertyDescriptor does not have value or get/set!");
            }
        }
        else {
            this.status = 2 /* NotFound */;
        }
    };
    FunctionInterceptor.prototype.interceptObjectOwnProperties = function (obj) {
        this.interceptProperty(obj, true);
    };
    return FunctionInterceptor;
}(FunctionInterceptorBase));
export { FunctionInterceptor };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25JbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZ1bmN0aW9uSW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEMsT0FBTyxFQUFFLGNBQWMsRUFBRSw2QkFBNkIsRUFBc0IsbUJBQW1CLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQW1DL0gsSUFBTSxXQUFXLEdBQVE7SUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0FBQ3ZELENBQUMsQ0FBQTtBQUtEO0lBQW1FLGdDQUFnQztJQUFuRzs7SUFBc0csQ0FBQztJQUFELG1CQUFDO0FBQUQsQ0FBQyxBQUF2RyxDQUFtRSxJQUFJLEdBQWdDO0FBR3ZHO0lBQXFFLGtDQUFrQztJQUF2Rzs7SUFBMEcsQ0FBQztJQUFELHFCQUFDO0FBQUQsQ0FBQyxBQUEzRyxDQUFxRSxJQUFJLEdBQWtDO0FBRzNHO0lBQW9FLGlDQUFpQztJQUFyRzs7SUFBd0csQ0FBQztJQUFELG9CQUFDO0FBQUQsQ0FBQyxBQUF6RyxDQUFvRSxJQUFJLEdBQWlDO0FBR3pHO0lBQXNFLG1DQUFtQztJQUF6Rzs7SUFBNEcsQ0FBQztJQUFELHNCQUFDO0FBQUQsQ0FBQyxBQUE3RyxDQUFzRSxJQUFJLEdBQW1DO0FBRTdHO0lBSVksMkNBQW1CO0lBVTdCLGlDQUFZLElBQVUsRUFBRSxZQUFvQztRQUFwQyw2QkFBQSxFQUFBLDBCQUFvQztRQUE1RCxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQVFaO1FBTkMsSUFBTSxJQUFJLEdBQUcsS0FBSSxDQUFDO1FBQ2xCLEtBQUksQ0FBQyxXQUFXLEdBQWE7WUFDM0IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQU8sU0FBUyxDQUFDLENB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