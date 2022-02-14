import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
var ShadowPrototype = /** @class */ (function () {
    function ShadowPrototype(targetPrototype, parentShadoPrototype) {
        var _a;
        this.targetPrototype = targetPrototype;
        this.parentShadoPrototype = parentShadoPrototype;
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
            while (obj && !matched) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFNdEM7SUFLRSx5QkFDa0IsZUFBMkIsRUFDMUIsb0JBQXdEOztRQUR6RCxvQkFBZSxHQUFmLGVBQWUsQ0FBWTtRQUMxQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQW9DO1FBTGxFLHdCQUFtQixHQUFHLElBQUksSUFBSSxFQUE2QixDQUFDO1FBQzVELHdCQUFtQixHQUFHLElBQUksSUFBSSxFQUE2QixDQUFDO1FBTW5FOzs7V0FHRztRQUNILElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFBLG9CQUFvQixhQUFwQixvQkFBb0IsdUJBQXBCLG9CQUFvQixDQUFFLFNBQVMsbUNBQUksSUFBSSxDQUFDLENBQUM7UUFFeEUsS0FBSSxnQkFBaUIsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlDLElBQUksR0FBRyxHQUFRLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQztZQUN0RCxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDcEIsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ3RCLE9BQU8sR0FBRyxHQUFHLEtBQUssS0FBSyxDQUFDO2dCQUN4QixHQUFHLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNsQztZQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUUseUJBQXlCLENBQUMsQ0FBQTtTQUMzQztJQUNILENBQUM7SUFFTyxxREFBMkIsR0FBbkMsVUFBb0MsR0FBZTs7UUFDakQsTUFBQSxJQUFJLENBQUMsb0JBQW9CLDBDQUFFLDJCQUEyQixDQUFDLEdBQTRCLENBQUMsQ0FBQztRQUNyRixNQUFBLElBQUksQ0FBQyxtQkFBbUIsMENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFTyxvREFBMEIsR0FBbEMsVUFBbUMsR0FBZTs7UUFDaEQsTUFBQSxJQUFJLENBQUMsb0JBQW9CLDBDQUFFLDBCQUEwQixDQUFDLEdBQTRCLENBQUMsQ0FBQztRQUNwRixNQUFBLElBQUksQ0FBQyxtQkFBbUIsMENBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFUywrQ0FBcUIsR0FBL0IsVUFBZ0MsR0FBZTs7UUFDN0MsTUFBQSxJQUFJLENBQUMsb0JBQW9CLDBDQUFFLHFCQUFxQixDQUFDLEdBQTRCLENBQUMsQ0FBQztRQUMvRSxrRUFBa0U7SUFDcEUsQ0FBQztJQUdNLHlDQUFlLEdBQXRCLFVBQXVCLEdBQWU7UUFDcEMsdUZBQXVGO1FBQ3ZGLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFDSCxzQkFBQztBQUFELENBQUMsQUFqREQsSUFpREMifQ==