/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
function getVirtualPropertyName(name, extension) {
    return extension?.useCaseInsensitivePropertyName ? ('' + name).toLocaleLowerCase() : name;
}
const ObjectHasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(obj, propName) {
    return ObjectHasOwnProperty.call(obj, propName);
}
export class ShadowPrototype {
    targetPrototype;
    parentShadoPrototype;
    extension;
    onBeforInterceptObj = new Hook();
    onAfterInterceptObj = new Hook();
    pendingPropertyInterceptors;
    constructor(targetPrototype, parentShadoPrototype) {
        this.targetPrototype = targetPrototype;
        this.parentShadoPrototype = parentShadoPrototype;
        /**
         * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
         * in the following methods
         */
        this.extension = Object.create(parentShadoPrototype?.extension ?? null);
        if ( /* __DEV__ && */this.parentShadoPrototype) {
            let obj = this.targetPrototype;
            let proto = this.parentShadoPrototype.targetPrototype;
            let matched = false;
            while (obj && !matched) {
                matched = obj === proto;
                obj = Object.getPrototypeOf(obj);
            }
            assert(matched, `Invalid prototype chain`);
        }
    }
    callOnBeforeInterceptObject(obj) {
        this.parentShadoPrototype?.callOnBeforeInterceptObject(obj);
        this.onBeforInterceptObj?.call(obj);
    }
    callOnAfterInterceptObject(obj) {
        this.parentShadoPrototype?.callOnAfterInterceptObject(obj);
        this.onAfterInterceptObj?.call(obj);
    }
    interceptObjectItself(obj) {
        this.parentShadoPrototype?.interceptObjectItself(obj);
        // We can make any necessary modificatio to the object itself here
        if (this.pendingPropertyInterceptors) {
            for (const pi of this.pendingPropertyInterceptors) {
                pi.interceptObjectOwnProperties(obj);
            }
        }
    }
    interceptObject(obj) {
        // This behaves similar to how constructors work, i.e. from parent class to child class
        this.callOnBeforeInterceptObject(obj);
        this.interceptObjectItself(obj);
        this.callOnAfterInterceptObject(obj);
    }
    addPendingPropertyInterceptor(pi) {
        if (!this.pendingPropertyInterceptors) {
            this.pendingPropertyInterceptors = [];
        }
        this.pendingPropertyInterceptors.push(pi);
    }
    getVirtualProperty(name) {
        const vtable = this.extension;
        const canonicalName = getVirtualPropertyName(name, vtable);
        return vtable[canonicalName];
    }
    setVirtualProperty(name, virtualProp) {
        const vtable = this.extension;
        const canonicalName = getVirtualPropertyName(name, vtable);
        if (__DEV__) {
            assert(!hasOwnProperty(vtable, canonicalName), `Vritual property ${name} already exists`);
            assert(!vtable[canonicalName], `virtual property ${name} will override the parent's.`, { logger: { error(msg) { console.warn(msg); } } });
        }
        vtable[canonicalName] = virtualProp;
    }
    removeVirtualPropery(name, virtualProp) {
        const vtable = this.extension;
        const canonicalName = getVirtualPropertyName(name, vtable);
        if (__DEV__) {
            assert(hasOwnProperty(vtable, canonicalName), `Vritual property ${name} does not exists`);
        }
        if (vtable[canonicalName] === virtualProp) {
            delete vtable[canonicalName];
        }
        else {
            console.error(`Vritual property ${name} does not match and was not deleted`);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQXNCdEMsU0FBUyxzQkFBc0IsQ0FBQyxJQUFZLEVBQUUsU0FBb0I7SUFDaEUsT0FBTyxTQUFTLEVBQUUsOEJBQThCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUM1RixDQUFDO0FBRUQsTUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztBQUM3RCxNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQVcsRUFBRSxRQUFnQjtJQUMxRCxPQUFPLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELE1BQU0sT0FBTyxlQUFlO0lBT1I7SUFDQztJQVBWLFNBQVMsQ0FBWTtJQUNyQixtQkFBbUIsR0FBRyxJQUFJLElBQUksRUFBNkIsQ0FBQztJQUM1RCxtQkFBbUIsR0FBRyxJQUFJLElBQUksRUFBNkIsQ0FBQztJQUM3RCwyQkFBMkIsQ0FBeUI7SUFFNUQsWUFDa0IsZUFBMkIsRUFDMUIsb0JBQXdEO1FBRHpELG9CQUFlLEdBQWYsZUFBZSxDQUFZO1FBQzFCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBb0M7UUFFekU7OztXQUdHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQztRQUV4RSxLQUFJLGdCQUFpQixJQUFJLENBQUMsb0JBQW9CLEVBQUU7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