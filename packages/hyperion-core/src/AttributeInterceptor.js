import { __extends } from "tslib";
import { assert } from "@hyperion/global";
import { FunctionInterceptorBase } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
var AttributeInterceptor = /** @class */ (function (_super) {
    __extends(AttributeInterceptor, _super);
    function AttributeInterceptor(name, shadowPrototype) {
        var _this = _super.call(this, name) || this;
        _this.getter = new FunctionInterceptorBase(name);
        _this.setter = new FunctionInterceptorBase(name);
        _this.interceptProperty(shadowPrototype.targetPrototype, false);
        if (_this.status !== 1 /* Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(_this);
        }
        return _this;
    }
    AttributeInterceptor.prototype.interceptProperty = function (obj, isOwnProperty) {
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
            if (desc.get || desc.set) {
                var get = desc.get, set = desc.set;
                if (get) {
                    this.getter.setOriginal(get);
                    desc.get = this.getter.interceptor;
                }
                if (set) {
                    this.setter.setOriginal(set);
                    desc.set = this.setter.interceptor;
                }
                __DEV__ && assert(desc.configurable, "Cannot intercept attribute " + this.name);
                defineProperty(desc.container, this.name, desc);
                if (__DEV__) {
                    var desc_1 = getExtendedPropertyDescriptor(obj, this.name);
                    assert((desc_1 === null || desc_1 === void 0 ? void 0 : desc_1.get) === this.getter.interceptor, "getter interceptor did not work");
                    assert((desc_1 === null || desc_1 === void 0 ? void 0 : desc_1.set) === this.setter.interceptor, "setter interceptor did not work");
                }
                this.status = desc.configurable ? 1 /* Intercepted */ : 4 /* NotConfigurable */;
            }
            else if (desc.value) {
                //TODO: we should replace this one with get/set
                console.warn("Property " + this.name + " does not seem to be an attribute");
                this.status = 3 /* NoGetterSetter */;
            }
            else {
                if (__DEV__) {
                    if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
                        console.warn("Un expected situation, attribute " + this.name + " does not have getter/setter defined");
                    }
                }
            }
        }
        else {
            this.status = 2 /* NotFound */;
        }
    };
    AttributeInterceptor.prototype.interceptObjectOwnProperties = function (obj) {
        return this.interceptProperty(obj, true);
    };
    return AttributeInterceptor;
}(PropertyInterceptor));
export { AttributeInterceptor };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXR0cmlidXRlSW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBdHRyaWJ1dGVJbnRlcmNlcHRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxjQUFjLEVBQUUsNkJBQTZCLEVBQXNCLG1CQUFtQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFHL0g7SUFBaUssd0NBQW1CO0lBR2xMLDhCQUFZLElBQVUsRUFBRSxlQUEwQztRQUFsRSxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQVVaO1FBUkMsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHVCQUF1QixDQUFrRCxJQUFJLENBQUMsQ0FBQztRQUNqRyxLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksdUJBQXVCLENBQStELElBQUksQ0FBQyxDQUFDO1FBRTlHLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRS9ELElBQUksS0FBSSxDQUFDLE1BQU0sd0JBQW1DLEVBQUU7WUFDbEQsZUFBZSxDQUFDLDZCQUE2QixDQUFDLEtBQUksQ0FBQyxDQUFDO1NBQ3JEOztJQUNILENBQUM7SUFFTyxnREFBaUIsR0FBekIsVUFBMEIsR0FBVyxFQUFFLGFBQXNCO1FBQzNELElBQUksSUFBSSxHQUFHLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsSUFBSSxhQUFhLEVBQUU7WUFDakIsSUFBSSxpQkFBb0IsQ0FBQyxDQUFDLCtDQUErQztZQUN6RSxJQUFJLElBQUksRUFBRTtnQkFDUixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLDhCQUE4QjtvQkFDL0QsaUJBQWUsR0FB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