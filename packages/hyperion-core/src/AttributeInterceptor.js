import { assert } from "@hyperion/global";
import { FunctionInterceptorBase } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, PropertyInterceptor } from "./PropertyInterceptor";
export class AttributeInterceptor extends PropertyInterceptor {
    getter;
    setter;
    constructor(name, shadowPrototype) {
        super(name);
        this.getter = new FunctionInterceptorBase(name);
        this.setter = new FunctionInterceptorBase(name);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXR0cmlidXRlSW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBdHRyaWJ1dGVJbnRlcmNlcHRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDaEUsT0FBTyxFQUFFLGNBQWMsRUFBRSw2QkFBNkIsRUFBc0IsbUJBQW1CLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUcvSCxNQUFNLE9BQU8sb0JBQTRJLFNBQVEsbUJBQW1CO0lBQ2xLLE1BQU0sQ0FBMkU7SUFDakYsTUFBTSxDQUF3RjtJQUM5RyxZQUFZLElBQVUsRUFBRSxlQUEwQztRQUNoRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFWixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksdUJBQXVCLENBQWtELElBQUksQ0FBQyxDQUFDO1FBQ2pHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx1QkFBdUIsQ0FBK0QsSUFBSSxDQUFDLENBQUM7UUFFOUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFL0QsSUFBSSxJQUFJLENBQUMsTUFBTSx3QkFBbUMsRUFBRTtZQUNsRCxlQUFlLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckQ7SUFDSCxDQUFDO0lBRU8saUJBQWlCLENBQUMsR0FBVyxFQUFFLGFBQXNCO1FBQzNELElBQUksSUFBSSxHQUFHLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsSUFBSSxhQUFhLEVBQUU7WUFDakIsSUFBSSxlQUFvQixDQUFDLENBQUMsK0NBQStDO1lBQ3pFLElBQUksSUFBSSxFQUFFO2dCQUNSLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMs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