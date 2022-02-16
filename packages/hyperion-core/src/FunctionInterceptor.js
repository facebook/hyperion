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
    function FunctionInterceptorBase(name, shadowPrototype) {
        var _this = _super.call(this, name) || this;
        var that = _this;
        _this.interceptor = function () {
            return that.dispatcherFunc.apply(this, arguments);
        };
        var propName = _this.name;
        var desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, propName);
        if (desc
            && desc.value) {
            _this.original = desc.value;
            desc.value = _this.interceptor;
            defineProperty(desc.container, propName, desc);
        }
        else {
            _this.original = unknownFunc;
        }
        _this.dispatcherFunc = _this.original; // By default just pass on to original
        return _this;
    }
    FunctionInterceptorBase.prototype.updateDispatcherFunc = function () {
        var state = 0;
        state |= this.onArgsFilter ? 8 /* HasArgsFilter */ : 0;
        state |= this.onArgsObserver ? 4 /* HasArgsObserver */ : 0;
        state |= this.onValueFilter ? 2 /* HasValueFilter */ : 0;
        state |= this.onValueObserver ? 1 /* HasValueObserver */ : 0;
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
/**
 * Function with 0 arity (https://en.wikipedia.org/wiki/Arity)
 */
var NullaryFunctionInterceptor = /** @class */ (function (_super) {
    __extends(NullaryFunctionInterceptor, _super);
    function NullaryFunctionInterceptor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NullaryFunctionInterceptor;
}(FunctionInterceptorBase));
export { NullaryFunctionInterceptor };
/**
 * Function with any arity (https://en.wikipedia.org/wiki/Arity)
 */
var FunctionInterceptor = /** @class */ (function (_super) {
    __extends(FunctionInterceptor, _super);
    function FunctionInterceptor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FunctionInterceptor;
}(NullaryFunctionInterceptor));
export { FunctionInterceptor };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25JbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZ1bmN0aW9uSW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEMsT0FBTyxFQUFFLGNBQWMsRUFBRSw2QkFBNkIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBbUMzRyxJQUFNLFdBQVcsR0FBUTtJQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFBO0FBS0Q7SUFBbUUsZ0NBQWdDO0lBQW5HOztJQUFzRyxDQUFDO0lBQUQsbUJBQUM7QUFBRCxDQUFDLEFBQXZHLENBQW1FLElBQUksR0FBZ0M7QUFHdkc7SUFBcUUsa0NBQWtDO0lBQXZHOztJQUEwRyxDQUFDO0lBQUQscUJBQUM7QUFBRCxDQUFDLEFBQTNHLENBQXFFLElBQUksR0FBa0M7QUFHM0c7SUFBb0UsaUNBQWlDO0lBQXJHOztJQUF3RyxDQUFDO0lBQUQsb0JBQUM7QUFBRCxDQUFDLEFBQXpHLENBQW9FLElBQUksR0FBaUM7QUFHekc7SUFBc0UsbUNBQW1DO0lBQXpHOztJQUE0RyxDQUFDO0lBQUQsc0JBQUM7QUFBRCxDQUFDLEFBQTdHLENBQXNFLElBQUksR0FBbUM7QUFFN0c7SUFJWSwyQ0FBbUI7SUFVN0IsaUNBQVksSUFBVSxFQUFFLGVBQW1DO1FBQTNELFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBb0JaO1FBbEJDLElBQU0sSUFBSSxHQUFHLEtBQUksQ0FBQztRQUNsQixLQUFJLENBQUMsV0FBVyxHQUFhO1lBQzNCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQTtRQUVE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