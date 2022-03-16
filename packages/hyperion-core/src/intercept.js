import { assert } from "@hyperion/global";
const ExtensionPropName = "__ext";
const ShadowPrototypePropName = "__sproto";
let extensionId = 0;
const ObjectHasOwnProperty = Object.prototype.hasOwnProperty;
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
    return ObjectHasOwnProperty.call(value, ExtensionPropName);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJjZXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJjZXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQWdCMUMsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUM7QUFDbEMsTUFBTSx1QkFBdUIsR0FBRyxVQUFVLENBQUM7QUFDM0MsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBR3BCLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUM7QUFHN0QsTUFBTSxzQkFBc0IsR0FBNEIsRUFBRSxDQUFDO0FBQzNEOzs7R0FHRztBQUNILE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxNQUE2QjtJQUN6RSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEMsT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUNYLE1BQU0sS0FBSyxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtZQUNkLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekM7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxRQUFtRixFQUFFLGVBQWdDO0lBQzNKLE9BQU8sSUFBSSxNQUFNLENBQ2YsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsRUFDbEMsNkRBQTZELFFBQVEsR0FBRyxFQUN4RSxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUNqRCxDQUFDO0lBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLEVBQUU7UUFDdkQsS0FBSyxFQUFFLGVBQWU7UUFDdEIsc0JBQXNCO0tBQ3ZCLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxJQUFJLHdCQUF3QixHQUF1QjtBQUNqRDs7OztHQUlHO0NBQ0osQ0FBQztBQUVGLFNBQVMsZUFBZSxDQUFDLEtBQVU7SUFDakM7OztPQUdHO0lBQ0gsSUFBSSxXQUFXLEdBQUcsT0FBTyxLQUFLLENBQUM7SUFDL0IsT0FBTyxLQUFLO1FBQ1YsQ0FBQyxXQUFXLEtBQUssUUFBUSxJQUFJLFdBQVcsS0FBSyxVQUFVLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFVO0lBQ3RDLE9BQU8sb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLEtBQVUsRUFBRSxlQUF3QztJQUM1RSxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNuRCxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxlQUFlLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1FBRTFGLHNDQUFzQztRQUV0QyxJQUFJLFdBQVcsR0FBRyxlQUFlLENBQUM7UUFFbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxXQUFXLElBQUksQ0FBQyxHQUFHLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtZQUN0RSxXQUFXLEdBQUcsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDaEQ7UUFFRCxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2hCLFdBQVcsR0FBRyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztTQUM5QztRQUVELElBQUksV0FBVyxFQUFFO1lBQ2YsSUFBSSxTQUFTLEdBQWU7Z0JBQzFCLHNCQUFzQixFQUFFLEVBQUU7Z0JBQzFCLGVBQWUsRUFBRSxXQUFXO2dCQUM1QixFQUFFLEVBQUUsV0FBVyxFQUFFO2FBQ2xCLENBQUE7WUFDRCx3QkFBd0IsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDMUUsV0FBVyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNwQztLQUVGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsTUFBTSxVQUFVLGtCQUFrQixDQUFJLEdBQXFCLEVBQUUsaUJBQTJCO0lBQ3RGLE9BQU8sSUFBSSxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFDakYsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDakMsSUFBSSxDQUFDLEdBQUcsSUFBSSxpQkFBaUIsRUFBRTtRQUM3QixTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZixHQUFHLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDOUI7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==