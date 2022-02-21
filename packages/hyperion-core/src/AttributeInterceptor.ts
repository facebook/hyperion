import { assert } from "@hyperion/global";
import { FunctionInterceptorBase } from "./FunctionInterceptor";
import { defineProperty, getExtendedPropertyDescriptor, InterceptionStatus, PropertyInterceptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

export class AttributeInterceptor<BaseType extends { [key: string]: any }, Name extends string, GetAttrType = BaseType[Name], SetAttrType = GetAttrType> extends PropertyInterceptor {
  public readonly getter: FunctionInterceptorBase<BaseType, Name, (this: BaseType) => GetAttrType>;
  public readonly setter: FunctionInterceptorBase<BaseType, Name, (this: BaseType, value: SetAttrType) => void>;
  constructor(name: Name, shadowPrototype: ShadowPrototype<BaseType>) {
    super(name);
    const desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, name);
    this.getter = new FunctionInterceptorBase<BaseType, Name, (this: BaseType) => GetAttrType>(name, desc && desc.get);
    this.setter = new FunctionInterceptorBase<BaseType, Name, (this: BaseType, value: SetAttrType) => void>(name, desc && desc.set);
    if (desc) {

      if (desc.get) {
        desc.get = this.getter.interceptor;
      }

      if (desc.set) {
        desc.set = this.setter.interceptor;
      }

      if (desc.get || desc.set) {
        __DEV__ && assert(desc.configurable, `Cannot intercept attribute ${name}`);
        defineProperty(desc.container, name, desc);
        // TODO: set some sort of status based on desc.configurable
        if (__DEV__) {
          let desc = getExtendedPropertyDescriptor(shadowPrototype.targetPrototype, name);
          assert(desc?.get === this.getter.interceptor, `getter interceptor did not work`);
          assert(desc?.set === this.setter.interceptor, `setter interceptor did not work`);
        }
        this.status = InterceptionStatus.Intercepted;
      } else {
        if (__DEV__) {
          if (desc.hasOwnProperty("get") || desc.hasOwnProperty("set")) {
            console.warn(`Un expected situation, attribute ${name} does not have getter/setter`);

          }
          if (desc.value) {
            console.warn(`Property ${name} does not seem to be an attribute`);
          }
        }
        this.status = InterceptionStatus.NoGetterSetter;
      }
    } else {
      this.status = InterceptionStatus.NotFound;
      __DEV__ && console.warn("Could not find attribute and install interceptor", name);
    }
  }
}