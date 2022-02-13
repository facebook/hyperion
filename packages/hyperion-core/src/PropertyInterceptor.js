import { assert } from "@hyperion/global";
var PropertyInterceptor = /** @class */ (function () {
    function PropertyInterceptor(name) {
        this.name = name;
        /* __DEV__ &&  */ assert(!!this.name, "Interceptor name should have value");
    }
    return PropertyInterceptor;
}());
export { PropertyInterceptor };
/**
  * Searches the object or its prototype chain for a given property name
  * and the actual object that has the property is stores in the .container
  * field.
  */
export function getExtendedPropertyDescriptor(obj, propName) {
    var desc;
    while (obj && !desc) {
        desc = Object.getOwnPropertyDescriptor(obj, propName);
        if (desc) {
            desc.container = obj;
        }
        obj = Object.getPrototypeOf(obj);
    }
    return desc;
}
export function defineProperty(obj, propName, desc) {
    __DEV__ && assert(!!desc, "invalid proper description");
    try {
        Object.defineProperty(obj, propName, desc);
    }
    catch (e) {
        __DEV__ && console.warn(propName, " defining throws exception : ", e, " on ", obj);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvcGVydHlJbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlByb3BlcnR5SW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBRXpDO0lBQ0UsNkJBQW1CLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQzdCLGlCQUFpQixDQUFBLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFDSCwwQkFBQztBQUFELENBQUMsQUFKRCxJQUlDOztBQU9EOzs7O0lBSUk7QUFDSixNQUFNLFVBQVUsNkJBQTZCLENBQUMsR0FBVyxFQUFFLFFBQWdCO0lBQ3pFLElBQUksSUFBNEMsQ0FBQztJQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNuQixJQUFJLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxRQUFRLENBQStCLENBQUM7UUFDcEYsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztTQUN0QjtRQUNELEdBQUcsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2xDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxHQUFXLEVBQUUsUUFBZ0IsRUFBRSxJQUF3QjtJQUNwRixPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUN4RCxJQUFJO1FBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzVDO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixPQUFPLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsK0JBQStCLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztLQUNwRjtBQUNILENBQUMifQ==