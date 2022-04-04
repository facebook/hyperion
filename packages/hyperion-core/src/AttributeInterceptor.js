/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { assert } from "@hyperion/global";
import { FunctionInterceptorBase } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, hasOwnProperty, PropertyInterceptor } from "./PropertyInterceptor";
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
            const get = function () {
                return virtualProperty;
            };
            const set = function (value) {
                virtualProperty = value;
            };
            if (desc) {
                if (desc.value && desc.writable) { // it has value and can change
                    virtualProperty = desc.value;
                    delete desc.value;
                    delete desc.writable;
                    desc.get = get;
                    desc.set = set;
                    desc.configurable = true;
                }
            }
            else {
                desc = {
                    get,
                    set,
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
                    if (hasOwnProperty(desc, "get") || hasOwnProperty(desc, "set")) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXR0cmlidXRlSW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBdHRyaWJ1dGVJbnRlcmNlcHRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUUsdUJBQXVCLEVBQXlCLE1BQU0sdUJBQXVCLENBQUM7QUFDdkYsT0FBTyxFQUFFLGNBQWMsRUFBRSw2QkFBNkIsRUFBRSxjQUFjLEVBQXNCLG1CQUFtQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFHL0ksTUFBTSxPQUFPLHdCQUtULFNBQVEsbUJBQW1CO0lBQ2IsTUFBTSxDQUFzRDtJQUM1RCxNQUFNLENBQXNEO0lBRTVFLFlBQVksSUFBVSxFQUFFLE1BQW1CLEVBQUUsTUFBbUI7UUFDOUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRVosSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHVCQUF1QixDQUE2QixJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEYsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHVCQUF1QixDQUE2QixJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFdEYsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFPLG9CQUtULFNBQVEsd0JBS1Q7SUFDRCxZQUFZLElBQVUsRUFBRSxlQUEwQztRQUNoRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFWixJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUvRCxJQUFJLElBQUksQ0FBQyxNQUFNLHdCQUFtQyxFQUFFO1lBQ2xELGVBQWUsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxHQUFXLEVBQUUsYUFBc0I7UUFDM0QsSUFBSSxJQUFJLEdBQUcsNkJBQTZCLENB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