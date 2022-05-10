/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { hasOwnProperty } from "./PropertyInterceptor";
import { FunctionInterceptorBase } from "./FunctionInterceptor";
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
    return value;
}
export function interceptFunction(func, fiCtor, name = `_annonymous`) {
    assert(typeof func === "function", `cannot intercept non-function input`);
    let funcInterceptor = func[ExtensionPropName];
    if (!funcInterceptor) {
        funcInterceptor = fiCtor ? new fiCtor(name, func) : new FunctionInterceptorBase(name, func);
        func[ExtensionPropName] = funcInterceptor;
        funcInterceptor.interceptor[ExtensionPropName] = funcInterceptor;
    }
    return funcInterceptor;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJjZXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJjZXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUV2RCxPQUFPLEVBQWdCLHVCQUF1QixFQUF5QixNQUFNLHVCQUF1QixDQUFDO0FBZXJHLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDO0FBQ2xDLE1BQU0sdUJBQXVCLEdBQUcsVUFBVSxDQUFDO0FBQzNDLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztBQUlwQixNQUFNLHNCQUFzQixHQUE0QixFQUFFLENBQUM7QUFDM0Q7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLDZCQUE2QixDQUFDLE1BQTZCO0lBQ3pFLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwQyxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQ1gsTUFBTSxLQUFLLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ2Qsc0JBQXNCLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN6QztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUFDLFFBQW1GLEVBQUUsZUFBZ0M7SUFDM0osT0FBTyxJQUFJLE1BQU0sQ0FDZixDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUNsQyw2REFBNkQsUUFBUSxHQUFHLEVBQ3hFLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQ2pELENBQUM7SUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSx1QkFBdUIsRUFBRTtRQUN2RCxLQUFLLEVBQUUsZUFBZTtRQUN0QixzQkFBc0I7S0FDdkIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELElBQUksd0JBQXdCLEdBQXVCO0FBQ2pEOzs7O0dBSUc7Q0FDSixDQUFDO0FBRUYsU0FBUyxlQUFlLENBQUMsS0FBVTtJQUNqQzs7O09BR0c7SUFDSCxJQUFJLFdBQVcsR0FBRyxPQUFPLEtBQUssQ0FBQztJQUMvQixPQUFPLEtBQUs7UUFDVixDQUFDLFdBQVcsS0FBSyxRQUFRLElBQUksV0FBVyxLQUFLLFVBQVUsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVU7SUFDdEMsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBVSxFQUFFLGVBQXdDO0lBQzVFLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ25ELE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFFMUYsc0NBQXNDO1FBRXRDLElBQUksV0FBVyxHQUFHLGVBQWUsQ0FBQztRQUVsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxDQUFDLEdBQUcsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQ3RFLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNoRDtRQUVELElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDaEIsV0FBVyxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsSUFBSSxXQUFXLEVBQUU7WUFDZixJQUFJLFNBQVMsR0FBZTtnQkFDMUIscUJBQXFCLEVBQUUsRUFBRTtnQkFDekIsZUFBZSxFQUFFLFdBQVc7Z0JBQzVCLEVBQUUsRUFBRSxXQUFXLEVBQUU7YUFDbEIsQ0FBQTtZQUNELHdCQUF3QixDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDM0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLDRDQUE0QztZQUN2SCxXQUFXLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BDO0tBRUY7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQWlCLEdBQXFCLEVBQUUsaUJBQTJCO0lBQ25HLE9BQU8sSUFBSSxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFDakYsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDakMsSUFBSSxDQUFDLEdBQUcsSUFBSSxpQkFBaUIsRUFBRTtRQUM3QixTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZixHQUFHLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDOUI7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQUksR0FBcUIsRUFBRSxRQUFnQjtJQUMzRSxNQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsT0FBTyxHQUFHLEVBQUUsZUFBZSxDQUFDLGtCQUFrQixDQUFJLFFBQVEsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFFRCxNQUFNLFVBQVUsdUJBQXVCLENBQUksR0FBcUIsRUFBRSxRQUFnQjtJQUNoRixNQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsT0FBc0IsR0FBRyxFQUFFLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQzVELENBQUM7QUFFRCxNQUFNLFVBQVUsdUJBQXVCLENBQUksR0FBcUIsRUFBRSxRQUFnQixFQUFFLEtBQVE7SUFDMUYsTUFBTSxHQUFHLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLElBQUksR0FBRyxFQUFFO1FBQ1AsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUM3QztTQUFNO1FBQ0wsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztLQUN6RDtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQVVELE1BQU0sVUFBVSxpQkFBaUIsQ0FDL0IsSUFBZ0MsRUFDaEMsTUFBK0csRUFDL0csT0FBZSxhQUFhO0lBRTVCLE1BQU0sQ0FBQyxPQUFPLElBQUksS0FBSyxVQUFVLEVBQUUscUNBQXFDLENBQUMsQ0FBQztJQUUxRSxJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUM5QyxJQUFJLENBQUMsZUFBZSxFQUFFO1FBQ3BCLGVBQWUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsZUFBZSxDQUFDO1FBQzFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsR0FBRyxlQUFlLENBQUE7S0FDakU7SUFDRCxPQUFPLGVBQWUsQ0FBQztBQUN6QixDQUFDIn0=