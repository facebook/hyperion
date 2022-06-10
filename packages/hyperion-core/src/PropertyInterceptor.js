/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
export class PropertyInterceptor {
    name;
    status = 0 /* InterceptionStatus.Unknown */;
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
const ObjectHasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(obj, propName) {
    return ObjectHasOwnProperty.call(obj, propName);
}
export function copyOwnProperties(src, dest) {
    if (!src || !dest) {
        // Not much to copy. This can legitimately happen if for example function/attribute value is undefined during interception.
        return;
    }
    const ownProps = Object.getOwnPropertyNames(src);
    for (let i = 0, length = ownProps.length; i < length; ++i) {
        const propName = ownProps[i];
        if (!(propName in dest)) {
            const desc = Object.getOwnPropertyDescriptor(src, propName); //Since we are iterating the getOwnPropertyNames, we know this must have value
            assert(desc != null, `Unexpected situation, we should have own property for ${propName}`);
            try {
                Object.defineProperty(dest, propName, desc);
            }
            catch (e) {
                __DEV__ && console.error("Adding property ", propName, " throws exception: ", e);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvcGVydHlJbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlByb3BlcnR5SW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFXekMsTUFBTSxPQUFnQixtQkFBbUI7SUFHcEI7SUFGWixNQUFNLHNDQUE4QjtJQUUzQyxZQUFtQixJQUFZO1FBQVosU0FBSSxHQUFKLElBQUksQ0FBUTtRQUM3QixPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLG9DQUFvQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELDRCQUE0QixDQUFDLElBQVk7UUFDdkMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUM1RCxDQUFDO0NBQ0Y7QUFPRDs7OztJQUlJO0FBQ0osTUFBTSxVQUFVLDZCQUE2QixDQUFDLEdBQVcsRUFBRSxRQUFnQjtJQUN6RSxJQUFJLElBQTRDLENBQUM7SUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDbkIsSUFBSSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUErQixDQUFDO1FBQ3BGLElBQUksSUFBSSxFQUFFO1lBQ1IsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7U0FDdEI7UUFDRCxHQUFHLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNsQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdELE1BQU0sVUFBVSxjQUFjLENBQUMsR0FBVyxFQUFFLFFBQWdCLEVBQUUsSUFBd0I7SUFDcEYsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDeEQsSUFBSTtRQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM1QztJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLCtCQUErQixFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDcEY7QUFDSCxDQUFDO0FBR0QsTUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztBQUM3RCxNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQVcsRUFBRSxRQUFnQjtJQUMxRCxPQUFPLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUdELE1BQU0sVUFBVSxpQkFBaUIsQ0FBNkIsR0FBTSxFQUFFLElBQU87SUFDM0UsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNqQiwySEFBMkg7UUFDM0gsT0FBTztLQUNSO0lBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDekQsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsRUFBRTtZQUN2QixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBc0IsQ0FBQyxDQUFDLDhFQUE4RTtZQUNoSyxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRSx5REFBeUQsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMxRixJQUFJO2dCQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUM3QztZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLE9BQU8sSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNsRjtTQUNGO0tBQ0Y7QUFDSCxDQUFDIn0=