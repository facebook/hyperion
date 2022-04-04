/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { hasOwnProperty } from "./PropertyInterceptor";
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
                virtualPropertyValues: {},
                shadowPrototype: shadowProto,
                id: extensionId++,
            };
            cachedPropertyDescriptor.value = extension;
            Object.defineProperty(value, ExtensionPropName, cachedPropertyDescriptor); // has to be done before interception starts
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
export function getVirtualProperty(obj, propName) {
    const ext = getObjectExtension(obj, true);
    return ext?.shadowPrototype.getVirtualProperty(propName);
}
export function getVirtualPropertyValue(obj, propName) {
    const ext = getObjectExtension(obj, true);
    return ext?.virtualPropertyValues[propName];
}
export function setVirtualPropertyValue(obj, propName, value) {
    const ext = getObjectExtension(obj, true);
    if (ext) {
        ext.virtualPropertyValues[propName] = value;
    }
    else {
        assert(!!ext, `Could not get extension for the object`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJjZXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJjZXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQWdCdkQsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUM7QUFDbEMsTUFBTSx1QkFBdUIsR0FBRyxVQUFVLENBQUM7QUFDM0MsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBSXBCLE1BQU0sc0JBQXNCLEdBQTRCLEVBQUUsQ0FBQztBQUMzRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsNkJBQTZCLENBQUMsTUFBNkI7SUFDekUsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDWCxNQUFNLEtBQUssR0FBRyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDZCxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3pDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsUUFBbUYsRUFBRSxlQUFnQztJQUMzSixPQUFPLElBQUksTUFBTSxDQUNmLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDLEVBQ2xDLDZEQUE2RCxRQUFRLEdBQUcsRUFDeEUsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FDakQsQ0FBQztJQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLHVCQUF1QixFQUFFO1FBQ3ZELEtBQUssRUFBRSxlQUFlO1FBQ3RCLHNCQUFzQjtLQUN2QixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsSUFBSSx3QkFBd0IsR0FBdUI7QUFDakQ7Ozs7R0FJRztDQUNKLENBQUM7QUFFRixTQUFTLGVBQWUsQ0FBQyxLQUFVO0lBQ2pDOzs7T0FHRztJQUNILElBQUksV0FBVyxHQUFHLE9BQU8sS0FBSyxDQUFDO0lBQy9CLE9BQU8sS0FBSztRQUNWLENBQUMsV0FBVyxLQUFLLFFBQVEsSUFBSSxXQUFXLEtBQUssVUFBVSxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBVTtJQUN0QyxPQUFPLGNBQWMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFVLEVBQUUsZUFBd0M7SUFDNUUsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDbkQsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZSxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUUxRixzQ0FBc0M7UUFFdEMsSUFBSSxXQUFXLEdBQUcsZUFBZSxDQUFDO1FBRWxDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxJQUFJLENBQUMsR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDdEUsV0FBVyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2hEO1FBRUQsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixXQUFXLEdBQUcsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLFdBQVcsRUFBRTtZQUNmLElBQUksU0FBUyxHQUFlO2dCQUMxQixxQkFBcUIsRUFBRSxFQUFFO2dCQUN6QixlQUFlLEVBQUUsV0FBVztnQkFDNUIsRUFBRSxFQUFFLFdBQVcsRUFBRTthQUNsQixDQUFBO1lBQ0Qsd0JBQXdCLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUMzQyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsNENBQTRDO1lBQ3ZILFdBQVcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7S0FFRjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBaUIsR0FBcUIsRUFBRSxpQkFBMkI7SUFDbkcsT0FBTyxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztJQUNqRixJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNqQyxJQUFJLENBQUMsR0FBRyxJQUFJLGlCQUFpQixFQUFFO1FBQzdCLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLEdBQUcsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUM5QjtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBSSxHQUFxQixFQUFFLFFBQWdCO0lBQzNFLE1BQU0sR0FBRyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxQyxPQUFPLEdBQUcsRUFBRSxlQUFlLENBQUMsa0JBQWtCLENBQUksUUFBUSxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUVELE1BQU0sVUFBVSx1QkFBdUIsQ0FBSSxHQUFxQixFQUFFLFFBQWdCO0lBQ2hGLE1BQU0sR0FBRyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxQyxPQUFzQixHQUFHLEVBQUUscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDNUQsQ0FBQztBQUVELE1BQU0sVUFBVSx1QkFBdUIsQ0FBSSxHQUFxQixFQUFFLFFBQWdCLEVBQUUsS0FBUTtJQUMxRixNQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsSUFBSSxHQUFHLEVBQUU7UUFDUCxHQUFHLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQzdDO1NBQU07UUFDTCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDO0tBQ3pEO0FBQ0gsQ0FBQyJ9