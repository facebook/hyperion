import { Hook } from "@hyperion/hook";
var ShadowPrototype = /** @class */ (function () {
    function ShadowPrototype(parentShadoPrototype) {
        var _a;
        this.parentShadoPrototype = parentShadoPrototype;
        this.onBeforInterceptObj = new Hook();
        this.onAfterInterceptObj = new Hook();
        /**
         * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
         * in the following methods
         */
        this.extension = Object.create((_a = parentShadoPrototype === null || parentShadoPrototype === void 0 ? void 0 : parentShadoPrototype.extension) !== null && _a !== void 0 ? _a : null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQU10QztJQUtFLHlCQUE2QixvQkFBd0Q7O1FBQXhELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBb0M7UUFINUUsd0JBQW1CLEdBQUcsSUFBSSxJQUFJLEVBQTZCLENBQUM7UUFDNUQsd0JBQW1CLEdBQUcsSUFBSSxJQUFJLEVBQTZCLENBQUM7UUFHbkU7OztXQUdHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQUEsb0JBQW9CLGFBQXBCLG9CQUFvQix1QkFBcEIsb0JBQW9CLENBQUUsU0FBUyxtQ0FBSSxJQUFJLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRU8scURBQTJCLEdBQW5DLFVBQW9DLEdBQWU7O1FBQ2pELE1BQUEsSUFBSSxDQUFDLG9CQUFvQiwwQ0FBRSwyQkFBMkIsQ0FBQyxHQUE0QixDQUFDLENBQUM7UUFDckYsTUFBQSxJQUFJLENBQUMsbUJBQW1CLDBDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU8sb0RBQTBCLEdBQWxDLFVBQW1DLEdBQWU7O1FBQ2hELE1BQUEsSUFBSSxDQUFDLG9CQUFvQiwwQ0FBRSwwQkFBMEIsQ0FBQyxHQUE0QixDQUFDLENBQUM7UUFDcEYsTUFBQSxJQUFJLENBQUMsbUJBQW1CLDBDQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRVMsK0NBQXFCLEdBQS9CLFVBQWdDLEdBQWU7O1FBQzdDLE1BQUEsSUFBSSxDQUFDLG9CQUFvQiwwQ0FBRSxxQkFBcUIsQ0FBQyxHQUE0QixDQUFDLENBQUM7UUFDL0Usa0VBQWtFO0lBQ3BFLENBQUM7SUFHTSx5Q0FBZSxHQUF0QixVQUF1QixHQUFlO1FBQ3BDLHVGQUF1RjtRQUN2RixJQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0gsc0JBQUM7QUFBRCxDQUFDLEFBbkNELElBbUNDIn0=