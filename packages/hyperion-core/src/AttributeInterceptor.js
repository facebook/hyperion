import { __extends } from "tslib";
import { assert } from "@hyperion/global";
import { FunctionInterceptorBase } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
var AttributeInterceptor = /** @class */ (function (_super) {
    __extends(AttributeInterceptor, _super);
    function AttributeInterceptor(name, shadowPrototype) {
        var _this = _super.call(this, name) || this;
        var desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, name);
        _this.getter = new FunctionInterceptorBase(name, desc && desc.get);
        _this.setter = new FunctionInterceptorBase(name, desc && desc.set);
        if (desc) {
            if (desc.get) {
                desc.get = _this.getter.interceptor;
            }
            if (desc.set) {
                desc.set = _this.setter.interceptor;
            }
            if (desc.get || desc.set) {
                __DEV__ && assert(desc.configurable, "Cannot intercept attribute " + name);
                defineProperty(desc.container, name, desc);
                // TODO: set some sort of status based on desc.configurable
                if (__DEV__) {
                    var desc_1 = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, name);
                    assert((desc_1 === null || desc_1 === void 0 ? void 0 : desc_1.get) === _this.getter.interceptor, "getter interceptor did not work");
                    assert((desc_1 === null || desc_1 === void 0 ? void 0 : desc_1.set) === _this.setter.interceptor, "setter interceptor did not work");
                }
                _this.status = 1 /* Intercepted */;
            }
            else {
                if (__DEV__) {
                    if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
                        console.warn("Un expected situation, attribute " + name + " does not have getter/setter");
                    }
                    if (desc.value) {
                        console.warn("Property " + name + " does not seem to be an attribute");
                    }
                }
                _this.status = 3 /* NoGetterSetter */;
            }
        }
        else {
            _this.status = 2 /* NotFound */;
            __DEV__ && console.warn("Could not find attribute and install interceptor", name);
        }
        return _this;
    }
    return AttributeInterceptor;
}(PropertyInterceptor));
export { AttributeInterceptor };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXR0cmlidXRlSW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBdHRyaWJ1dGVJbnRlcmNlcHRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxjQUFjLEVBQUUsNkJBQTZCLEVBQXNCLG1CQUFtQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFHL0g7SUFBaUssd0NBQW1CO0lBR2xMLDhCQUFZLElBQVUsRUFBRSxlQUEwQztRQUFsRSxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQXdDWjtRQXZDQyxJQUFNLElBQUksR0FBRyw2QkFBNkIsQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xGLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx1QkFBdUIsQ0FBa0QsSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkgsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHVCQUF1QixDQUErRCxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoSSxJQUFJLElBQUksRUFBRTtZQUVSLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDWixJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO2FBQ3BDO1lBRUQsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7YUFDcEM7WUFFRCxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDeEIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGdDQUE4QixJQUFNLENBQUMsQ0FBQztnQkFDM0UsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQywyREFBMkQ7Z0JBQzNELElBQUksT0FBTyxFQUFFO29CQUNYLElBQUksTUFBSSxHQUFHLDZCQUE2QixDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ2hGLE1BQU0sQ0FBQyxDQUFBLE1BQUksYUFBSixNQUFJLHVCQUFKLE1BQUksQ0FBRSxHQUFHLE1BQUssS0FBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztvQkFDakYsTUFBTSxDQUFDLENBQUEsTUFBSSxhQUFKLE1BQUksdUJBQUosTUFBSSxDQUFFLEdBQUcsTUFBSyxLQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO2lCQUNsRjtnQkFDRCxLQUFJLENBQUMsTUFBTSxzQkFBaUMsQ0FBQzthQUM5QztpQkFBTTtnQkFDTCxJQUFJLE9BQU8sRUFBRTtvQkFDWCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDNUQsT0FBTyxDQUFDLElBQUksQ0FBQyxzQ0FBb0MsSUFBSSxpQ0FBOEIsQ0FBQyxDQUFDO3FCQUV0RjtvQkFDRCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7d0JBQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFZLElBQUksc0NBQW1DLENBQUMsQ0FBQztxQkFDbkU7aUJBQ0Y7Z0JBQ0QsS0FBSSxDQUFDLE1BQU0seUJBQW9DLENBQUM7YUFDakQ7U0FDRjthQUFNO1lBQ0wsS0FBSSxDQUFDLE1BQU0sbUJBQThCLENBQUM7WUFDMUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0RBQWtELEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDbkY7O0lBQ0gsQ0FBQztJQUNILDJCQUFDO0FBQUQsQ0FBQyxBQTdDRCxDQUFpSyxtQkFBbUIsR0E2Q25MIn0=