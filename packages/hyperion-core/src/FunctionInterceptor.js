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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25JbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZ1bmN0aW9uSW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBTzNGLElBQU0sV0FBVyxHQUFRO0lBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUE7QUFFRDtJQUlZLDJDQUFtQjtJQUc3QixpQ0FBWSxJQUFVLEVBQUUsZUFBbUM7UUFBM0QsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FXWjtRQVZDLElBQUksUUFBUSxHQUFHLEtBQUksQ0FBQyxJQUFJLENBQUM7UUFDekIsSUFBTSxJQUFJLEdBQUcsNkJBQTZCLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RixJQUNFLElBQUk7ZUFDRCxJQUFJLENBQUMsS0FBSyxFQUNiO1lBQ0EsS0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQzVCO2FBQU07WUFDTCxLQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQztTQUM3Qjs7SUFDSCxDQUFDO0lBQ0gsOEJBQUM7QUFBRCxDQUFDLEFBcEJELENBSVksbUJBQW1CLEdBZ0I5QjtBQUVEOztHQUVHO0FBQ0g7SUFDVSw4Q0FBeUM7SUFEbkQ7O0lBRUEsQ0FBQztJQUFELGlDQUFDO0FBQUQsQ0FBQyxBQUZELENBQ1UsdUJBQXVCLEdBQ2hDOztBQUVEOztHQUVHO0FBQ0g7SUFDVSx1Q0FBbUM7SUFEN0M7O0lBRUEsQ0FBQztJQUFELDBCQUFDO0FBQUQsQ0FBQyxBQUZELENBQ1UsMEJBQTBCLEdBQ25DIn0=