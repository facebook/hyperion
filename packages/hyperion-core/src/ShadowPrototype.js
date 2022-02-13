import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
var ShadowPrototype = /** @class */ (function () {
    function ShadowPrototype(parentShadoPrototype, targetPrototype) {
        var _a;
        this.parentShadoPrototype = parentShadoPrototype;
        this.targetPrototype = targetPrototype;
        this.onBeforInterceptObj = new Hook();
        this.onAfterInterceptObj = new Hook();
        /**
         * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
         * in the following methods
         */
        this.extension = Object.create((_a = parentShadoPrototype === null || parentShadoPrototype === void 0 ? void 0 : parentShadoPrototype.extension) !== null && _a !== void 0 ? _a : null);
        if ( /* __DEV__ && */this.parentShadoPrototype) {
            var obj = this.targetPrototype;
            var proto = this.parentShadoPrototype.targetPrototype;
            var matched = false;
            while (obj && matched) {
                matched = obj === proto;
                obj = Object.getPrototypeOf(obj);
            }
            assert(matched, "Invalid prototype chain");
        }
    }
    ShadowPrototype.prototype.callOnBeforeInterceptObject = function (obj) {
        var _a, _b;
        (_a = this.parentShadoPrototype) === null || _a === void 0 ? void 0 : _a.callOnBeforeInterceptObject(obj);
        (_b = this.onBeforInterceptObj) === null || _b === void 0 ? void 0 : _b.call(obj);
    };
    ShadowPrototype.prototype.callOnAfterInterceptObject = function (obj) {
        var _a, _b;
        (_a = this.parentShadoPrototype) === null || _a === void 0 ? void 0 : _a.callOnAfterInterceptObject(obj);
        (_b = this.onAfterInterceptObj) === null || _b === void 0 ? void 0 : _b.call(obj);
    };
    ShadowPrototype.prototype.interceptObjectItself = function (obj) {
        var _a;
        (_a = this.parentShadoPrototype) === null || _a === void 0 ? void 0 : _a.interceptObjectItself(obj);
        // We can make any necessary modificatio to the object itself here
    };
    ShadowPrototype.prototype.interceptObject = function (obj) {
        // This behaves similar to how constructors work, i.e. from parent class to child class
        this.callOnBeforeInterceptObject(obj);
        this.interceptObjectItself(obj);
        this.callOnAfterInterceptObject(obj);
    };
    return ShadowPrototype;
}());
export { ShadowPrototype };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFNdEM7SUFLRSx5QkFDbUIsb0JBQXdELEVBQ3pELGVBQXVCOztRQUR0Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQW9DO1FBQ3pELG9CQUFlLEdBQWYsZUFBZSxDQUFRO1FBTGhDLHdCQUFtQixHQUFHLElBQUksSUFBSSxFQUE2QixDQUFDO1FBQzVELHdCQUFtQixHQUFHLElBQUksSUFBSSxFQUE2QixDQUFDO1FBTW5FOzs7V0FHRztRQUNILElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFBLG9CQUFvQixhQUFwQixvQkFBb0IsdUJBQXBCLG9CQUFvQixDQUFFLFNBQVMsbUNBQUksSUFBSSxDQUFDLENBQUM7UUFFeEUsS0FBSSxnQkFBaUIsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDL0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQztZQUN0RCxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDcEIsT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFO2dCQUNyQixPQUFPLEdBQUcsR0FBRyxLQUFLLEtBQUssQ0FBQztnQkFDeEIsR0FBRyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDbEM7WUFDRCxNQUFNLENBQUMsT0FBTyxFQUFFLHlCQUF5QixDQUFDLENBQUE7U0FDM0M7SUFDSCxDQUFDO0lBRU8scURBQTJCLEdBQW5DLFVBQW9DLEdBQWU7O1FBQ2pELE1BQUEsSUFBSSxDQUFDLG9CQUFvQiwwQ0FBRSwyQkFBMkIsQ0FBQyxHQUE0QixDQUFDLENBQUM7UUFDckYsTUFBQSxJQUFJLENBQUMsbUJBQW1CLDBDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU8sb0RBQTBCLEdBQWxDLFVBQW1DLEdBQWU7O1FBQ2hELE1BQUEsSUFBSSxDQUFDLG9CQUFvQiwwQ0FBRSwwQkFBMEIsQ0FBQyxHQUE0QixDQUFDLENBQUM7UUFDcEYsTUFBQSxJQUFJLENBQUMsbUJBQW1CLDBDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRVMsK0NBQXFCLEdBQS9CLFVBQWdDLEdBQWU7O1FBQzdDLE1BQUEsSUFBSSxDQUFDLG9CQUFvQiwwQ0FBRSxxQkFBcUIsQ0FBQyxHQUE0QixDQUFDLENBQUM7UUFDL0Usa0VBQWtFO0lBQ3BFLENBQUM7SUFHTSx5Q0FBZSxHQUF0QixVQUF1QixHQUFlO1FBQ3BDLHVGQUF1RjtRQUN2RixJQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0gsc0JBQUM7QUFBRCxDQUFDLEFBakRELElBaURDIn0=