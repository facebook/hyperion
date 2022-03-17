import { assert } from "@hyperion/global";
import { hasOwnProperty } from "./ShadowPrototype";
const ExtensionPropName = "__ext";
const ShadowPrototypePropName = "__sproto";
let extensionId = 0;
const shadowPrototypeGetters = [];
/**
 * @param getter function to map a given object to a shadow prototype
 * @returns a function that can remove the getter.
 */
export function registerShadowPrototypeGetter(getter) {
    shadowPrototypeGetters.push(getter);
    return (() => {
        const index = shadowPrototypeGetters.indexOf(getter);
        if (index > -1) {
            shadowPrototypeGetters.splice(index, 1);
        }
    });
}
/**
 * intercept function can look up the prototype chain to find a proper ShadowPrototype for intercepting
 * a given object.
 * You should be careful to call this function on non-leaf nodes of the prototype chain.
 * This will be the last priority after the shadowPrototypeGetters is tried
 */
export function registerShadowPrototype(protoObj, shadowPrototype) {
    __DEV__ && assert(!protoObj[ShadowPrototypePropName], `hiding existing ShadowPrototype in the chain of prototype ${protoObj}.`, { logger: { error: msg => console.debug(msg) } });
    Object.defineProperty(protoObj, ShadowPrototypePropName, {
        value: shadowPrototype,
        // configurable: true,
    });
}
let cachedPropertyDescriptor = {
/** Want all the following fields to be false, but should not specify explicitly
 * enumerable: false,
 * writable: false,
 * configurable: false
 */
};
function isInterceptable(value) {
    /**
     * Generally we want to intercept objects and functions
     * Html tags are generally object, but some browsers use function for tags such as <object>, <embed>, ...
     */
    let typeofValue = typeof value;
    return value &&
        (typeofValue === "object" || typeofValue === "function");
}
export function isIntercepted(value) {
    return hasOwnProperty(value, ExtensionPropName);
}
export function intercept(value, shadowPrototype) {
    if (isInterceptable(value) && !isIntercepted(value)) {
        __DEV__ && assert(!!shadowPrototype || !value[ExtensionPropName], "Unexpected situation");
        // TODO: check for custom interceptors
        let shadowProto = shadowPrototype;
        for (let i = 0; !shadowProto && i < shadowPrototypeGetters.length; ++i) {
            shadowProto = shadowPrototypeGetters[i](value);
        }
        if (!shadowProto) {
            shadowProto = value[ShadowPrototypePropName];
        }
        if (shadowProto) {
            let extension = {
                virtualAttributeValues: {},
                shadowPrototype: shadowProto,
                id: extensionId++,
            };
            cachedPropertyDescriptor.value = extension;
            Object.defineProperty(value, ExtensionPropName, cachedPropertyDescriptor);
            shadowProto.interceptObject(value);
        }
    }
    return value;
}
export function getObjectExtension(obj, interceptIfAbsent) {
    __DEV__ && assert(isInterceptable(obj), "Only objects or functions are allowed");
    let ext = obj[ExtensionPropName];
    if (!ext && interceptIfAbsent) {
        intercept(obj);
        ext = obj[ExtensionPropName];
    }
    return ext;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJjZXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJjZXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsY0FBYyxFQUFtQixNQUFNLG1CQUFtQixDQUFDO0FBZXBFLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDO0FBQ2xDLE1BQU0sdUJBQXVCLEdBQUcsVUFBVSxDQUFDO0FBQzNDLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztBQUlwQixNQUFNLHNCQUFzQixHQUE0QixFQUFFLENBQUM7QUFDM0Q7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLDZCQUE2QixDQUFDLE1BQTZCO0lBQ3pFLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwQyxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQ1gsTUFBTSxLQUFLLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ2Qsc0JBQXNCLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN6QztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUFDLFFBQW1GLEVBQUUsZUFBZ0M7SUFDM0osT0FBTyxJQUFJLE1BQU0sQ0FDZixDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUNsQyw2REFBNkQsUUFBUSxHQUFHLEVBQ3hFLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQ2pELENBQUM7SUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSx1QkFBdUIsRUFBRTtRQUN2RCxLQUFLLEVBQUUsZUFBZTtRQUN0QixzQkFBc0I7S0FDdkIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELElBQUksd0JBQXdCLEdBQXVCO0FBQ2pEOzs7O0dBSUc7Q0FDSixDQUFDO0FBRUYsU0FBUyxlQUFlLENBQUMsS0FBVTtJQUNqQzs7O09BR0c7SUFDSCxJQUFJLFdBQVcsR0FBRyxPQUFPLEtBQUssQ0FBQztJQUMvQixPQUFPLEtBQUs7UUFDVixDQUFDLFdBQVcsS0FBSyxRQUFRLElBQUksV0FBVyxLQUFLLFVBQVUsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVU7SUFDdEMsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBVSxFQUFFLGVBQXdDO0lBQzVFLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ25ELE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFFMUYsc0NBQXNDO1FBRXRDLElBQUksV0FBVyxHQUFHLGVBQWUsQ0FBQztRQUVsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxDQUFDLEdBQUcsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQ3RFLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNoRDtRQUVELElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDaEIsV0FBVyxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsSUFBSSxXQUFXLEVBQUU7WUFDZixJQUFJLFNBQVMsR0FBZTtnQkFDMUIsc0JBQXNCLEVBQUUsRUFBRTtnQkFDMUIsZUFBZSxFQUFFLFdBQVc7Z0JBQzVCLEVBQUUsRUFBRSxXQUFXLEVBQUU7YUFDbEIsQ0FBQTtZQUNELHdCQUF3QixDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDM0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQUMxRSxXQUFXLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BDO0tBRUY7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQUksR0FBcUIsRUFBRSxpQkFBMkI7SUFDdEYsT0FBTyxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztJQUNqRixJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNqQyxJQUFJLENBQUMsR0FBRyxJQUFJLGlCQUFpQixFQUFFO1FBQzdCLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLEdBQUcsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUM5QjtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9