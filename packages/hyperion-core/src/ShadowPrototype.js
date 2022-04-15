/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { hasOwnProperty } from "./PropertyInterceptor";
function getVirtualPropertyName(name, extension) {
    return extension?.useCaseInsensitivePropertyName ? ('' + name).toLocaleLowerCase() : name;
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
        return virtualProp;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZG93UHJvdG90eXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiU2hhZG93UHJvdG90eXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztHQUVHO0FBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0QyxPQUFPLEVBQUUsY0FBYyxFQUF1QixNQUFNLHVCQUF1QixDQUFDO0FBc0I1RSxTQUFTLHNCQUFzQixDQUFDLElBQVksRUFBRSxTQUFvQjtJQUNoRSxPQUFPLFNBQVMsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzVGLENBQUM7QUFFRCxNQUFNLE9BQU8sZUFBZTtJQU9SO0lBQ0M7SUFQVixTQUFTLENBQVk7SUFDckIsbUJBQW1CLEdBQUcsSUFBSSxJQUFJLEVBQTZCLENBQUM7SUFDNUQsbUJBQW1CLEdBQUcsSUFBSSxJQUFJLEVBQTZCLENBQUM7SUFDN0QsMkJBQTJCLENBQXlCO0lBRTVELFlBQ2tCLGVBQTJCLEVBQzFCLG9CQUF3RDtRQUR6RCxvQkFBZSxHQUFmLGVBQWUsQ0FBWTtRQUMxQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQW9DO1FBRXpFOzs7V0FHRztRQUNILElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLElBQUksSUFBSSxDQUFDLENBQUM7UUFFeEUsS0FBSSxnQkFBaUIsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlDLElBQUksR0FBRyxHQUFRLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQztZQUN0RCxJQUFJLE9BQU8sR0FBRyxLQUFL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