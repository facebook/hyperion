import { __extends } from "tslib";
import { getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
var unknownFunc = function () {
    console.warn('Unknown or missing function called! ');
};
var FunctionInterceptorBase = /** @class */ (function (_super) {
    __extends(FunctionInterceptorBase, _super);
    function FunctionInterceptorBase(name, shadowPrototype) {
        var _this = _super.call(this, name) || this;
        var propName = _this.name;
        var desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, propName);
        if (desc
            && desc.value) {
            _this.original = desc.value;
        }
        else {
            _this.original = unknownFunc;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25JbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZ1bmN0aW9uSW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBTTNGLElBQU0sV0FBVyxHQUFRO0lBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUE7QUFFRDtJQUE4RSwyQ0FBbUI7SUFHL0YsaUNBQVksSUFBWSxFQUFFLGVBQWdDO1FBQTFELFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBV1o7UUFWQyxJQUFJLFFBQVEsR0FBRyxLQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3pCLElBQU0sSUFBSSxHQUFHLDZCQUE2QixDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEYsSUFDRSxJQUFJO2VBQ0QsSUFBSSxDQUFDLEtBQUssRUFDYjtZQUNBLEtBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztTQUM1QjthQUFNO1lBQ0wsS0FBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7U0FDN0I7O0lBQ0gsQ0FBQztJQUNILDhCQUFDO0FBQUQsQ0FBQyxBQWhCRCxDQUE4RSxtQkFBbUIsR0FnQmhHO0FBRUQ7O0dBRUc7QUFDSDtJQUF3Riw4Q0FBaUM7SUFBekg7O0lBQ0EsQ0FBQztJQUFELGlDQUFDO0FBQUQsQ0FBQyxBQURELENBQXdGLHVCQUF1QixHQUM5Rzs7QUFFRDs7R0FFRztBQUNIO0lBQWlGLHVDQUFvQztJQUFySDs7SUFDQSxDQUFDO0lBQUQsMEJBQUM7QUFBRCxDQUFDLEFBREQsQ0FBaUYsMEJBQTBCLEdBQzFHIn0=