import { __extends } from "tslib";
import { Hook } from "@hyperion/hook";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
var unknownFunc = function () {
    console.warn('Unknown or missing function called! ');
};
var FunctionInterceptorBase = /** @class */ (function (_super) {
    __extends(FunctionInterceptorBase, _super);
    function FunctionInterceptorBase(name, shadowPrototype) {
        var _this = _super.call(this, name) || this;
        _this.onValueObserver = new Hook();
        _this.interceptor = function () {
            var result = that.original.apply(this, arguments);
            that.onValueObserver.call.call(this, result);
            return result;
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
        var that = _this;
        return _this;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25JbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZ1bmN0aW9uSW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0QyxPQUFPLEVBQUUsY0FBYyxFQUFFLDZCQUE2QixFQUFFLG1CQUFtQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFPM0csSUFBTSxXQUFXLEdBQVE7SUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0FBQ3ZELENBQUMsQ0FBQTtBQUVEO0lBSVksMkNBQW1CO0lBSzdCLGlDQUFZLElBQVUsRUFBRSxlQUFtQztRQUEzRCxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQXFCWjtRQTFCTSxxQkFBZSxHQUFHLElBQUksSUFBSSxFQUF5QyxDQUFDO1FBT3pFLEtBQUksQ0FBQyxXQUFXLEdBQWE7WUFDM0IsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0MsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQyxDQUFBO1FBRUQsSUFBSSxRQUFRLEdBQUcsS0FBSSxDQUFDLElBQUksQ0FBQztRQUN6QixJQUFNLElBQUksR0FBRyw2QkFBNkIsQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RGLElBQ0UsSUFBSTtlQUNELElBQUksQ0FBQyxLQUFLLEVBQ2I7WUFDQSxLQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFJLENBQUMsV0FBVyxDQUFDO1lBQzlCLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNoRDthQUFNO1lBQ0wsS0FBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7U0FDN0I7UUFDRCxJQUFNLElBQUksR0FBRyxLQUFJLENBQUM7O0lBQ3BCLENBQUM7SUFDSCw4QkFBQztBQUFELENBQUMsQUFoQ0QsQ0FJWSxtQkFBbUIsR0E0QjlCO0FBRUQ7O0dBRUc7QUFDSDtJQUNVLDhDQUF5QztJQURuRDs7SUFFQSxDQUFDO0lBQUQsaUNBQUM7QUFBRCxDQUFDLEFBRkQsQ0FDVSx1QkFBdUIsR0FDaEM7O0FBRUQ7O0dBRUc7QUFDSDtJQUNVLHVDQUFtQztJQUQ3Qzs7SUFFQSxDQUFDO0lBQUQsMEJBQUM7QUFBRCxDQUFDLEFBRkQsQ0FDVSwwQkFBMEIsR0FDbkMifQ==