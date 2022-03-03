import { assert } from "@hyperion/global";
export class PropertyInterceptor {
    name;
    status = 0 /* Unknown */;
    constructor(name) {
        this.name = name;
        __DEV__ && assert(!!this.name, "Interceptor name should have value");
    }
    interceptObjectOwnProperties(_obj) {
        __DEV__ && assert(false, `This method must be overriden`);
    }
}
/**
  * Searches the object or its prototype chain for a given property name
  * and the actual object that has the property is stores in the .container
  * field.
  */
export function getExtendedPropertyDescriptor(obj, propName) {
    let desc;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvcGVydHlJbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlByb3BlcnR5SW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBV3pDLE1BQU0sT0FBZ0IsbUJBQW1CO0lBR3BCO0lBRlosTUFBTSxtQkFBOEI7SUFFM0MsWUFBbUIsSUFBWTtRQUFaLFNBQUksR0FBSixJQUFJLENBQVE7UUFDN0IsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCw0QkFBNEIsQ0FBQyxJQUFZO1FBQ3ZDLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLCtCQUErQixDQUFDLENBQUM7SUFDNUQsQ0FBQztDQUNGO0FBT0Q7Ozs7SUFJSTtBQUNKLE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxHQUFXLEVBQUUsUUFBZ0I7SUFDekUsSUFBSSxJQUE0QyxDQUFDO0lBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ25CLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBK0IsQ0FBQztRQUNwRixJQUFJLElBQUksRUFBRTtZQUNSLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO1NBQ3RCO1FBQ0QsR0FBRyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDbEM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFHRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQVcsRUFBRSxRQUFnQixFQUFFLElBQXdCO0lBQ3BGLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3hELElBQUk7UUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDNUM7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3BGO0FBQ0gsQ0FBQyJ9