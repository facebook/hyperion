/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { FunctionInterceptorBase } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
export class AttributeInterceptorBase extends PropertyInterceptor {
    getter;
    setter;
    constructor(name, getter, setter) {
        super(name);
        this.getter = new FunctionInterceptorBase(name, getter);
        this.setter = new FunctionInterceptorBase(name, setter);
    }
}
export class AttributeInterceptor extends AttributeInterceptorBase {
    constructor(name, shadowPrototype) {
        super(name);
        this.interceptProperty(shadowPrototype.targetPrototype, false);
        if (this.status !== 1 /* Intercepted */) {
            shadowPrototype.addPendingPropertyInterceptor(this);
        }
    }
    interceptProperty(obj, isOwnProperty) {
        let desc = getExtendedPropertyDescriptor(obj, this.name);
        if (isOwnProperty) {
            let virtualProperty; // TODO: we should do this on the object itself
            if (desc) {
                if (desc.value && desc.writable) { // it has value and can change
                    virtualProperty = desc.value;
                    delete desc.value;
                    delete desc.writable;
                    desc.get = function () { return virtualProperty; };
                    desc.set = function (value) { virtualProperty = value; };
                    desc.configurable = true;
                }
            }
            else {
                desc = {
                    get: function () { return virtualProperty; },
                    set: function (value) { virtualProperty = value; },
                    enumerable: true,
                    configurable: true,
                    container: obj
                };
            }
        }
        if (desc) {
            if (desc.get || desc.set) {
                const { get, set } = desc;
                if (get) {
                    this.getter.setOriginal(get);
                    desc.get = this.getter.interceptor;
                }
                if (set) {
                    this.setter.setOriginal(set);
                    desc.set = this.setter.interceptor;
                }
                __DEV__ && assert(desc.configurable, `Cannot intercept attribute ${this.name}`);
                defineProperty(desc.container, this.name, desc);
                if (__DEV__) {
                    let desc = getExtendedPropertyDescriptor(obj, this.name);
                    assert(desc?.get === this.getter.interceptor, `getter interceptor did not work`);
                    assert(desc?.set === this.setter.interceptor, `setter interceptor did not work`);
                }
                this.status = desc.configurable ? 1 /* Intercepted */ : 4 /* NotConfigurable */;
            }
            else if (desc.value) {
                //TODO: we should replace this one with get/set
                console.warn(`Property ${this.name} does not seem to be an attribute`);
                this.status = 3 /* NoGetterSetter */;
            }
            else {
                if (__DEV__) {
                    if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
                        console.warn(`Un expected situation, attribute ${this.name} does not have getter/setter defined`);
                    }
                }
            }
        }
        else {
            this.status = 2 /* NotFound */;
        }
    }
    interceptObjectOwnProperties(obj) {
        return this.interceptProperty(obj, true);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXR0cmlidXRlSW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBdHRyaWJ1dGVJbnRlcmNlcHRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsdUJBQXVCLEVBQXlCLE1BQU0sdUJBQXVCLENBQUM7QUFDdkYsT0FBTyxFQUFFLGNBQWMsRUFBRSw2QkFBNkIsRUFBc0IsbUJBQW1CLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUcvSCxNQUFNLE9BQU8sd0JBS1QsU0FBUSxtQkFBbUI7SUFDYixNQUFNLENBQXNEO0lBQzVELE1BQU0sQ0FBc0Q7SUFFNUUsWUFBWSxJQUFVLEVBQUUsTUFBbUIsRUFBRSxNQUFtQjtRQUM5RCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFWixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksdUJBQXVCLENBQTZCLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNwRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksdUJBQXVCLENBQTZCLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUV0RixDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sb0JBS1QsU0FBUSx3QkFLVDtJQUNELFlBQVksSUFBVSxFQUFFLGVBQTBDO1FBQ2hFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVaLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRS9ELElBQUksSUFBSSxDQUFDLE1BQU0sd0JBQW1DLEVBQUU7WUFDbEQsZUFBZSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JEO0lBQ0gsQ0FBQztJQUVPLGlCQUFpQixDQUFDLEdBQVcsRUFBRSxhQUFzQjtRQUMzRCxJQUFJLElBQUksR0FBRyw2QkFBNkIsQ0FBQyxHQUFHLEVB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