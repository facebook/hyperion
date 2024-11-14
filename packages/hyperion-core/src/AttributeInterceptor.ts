/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "hyperion-globals";
import { FunctionInterceptor, getFunctionInterceptor, InterceptableFunction } from "./FunctionInterceptor";
import { defineProperty, ExtendedPropertyDescriptor, getExtendedPropertyDescriptor, hasOwnProperty, InterceptionStatus, PropertyInterceptor } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

const ATTRIBUTE_INTERCEPTOR_PROP_NAME = "__attributeInterceptor";

export class AttributeInterceptorBase<
  BaseType extends { [key: string]: any },
  Name extends string,
  GetterType extends InterceptableFunction = (this: BaseType) => BaseType[Name],
  SetterType extends InterceptableFunction = (this: BaseType, value: BaseType[Name]) => void
> extends PropertyInterceptor {
  public readonly getter: FunctionInterceptor<BaseType, Name, GetterType>;
  public readonly setter: FunctionInterceptor<BaseType, Name, SetterType>;

  constructor(name: Name, getter?: GetterType, setter?: SetterType) {
    super(name);

    this.getter = new FunctionInterceptor<BaseType, Name, GetterType>(name, getter);
    this.setter = new FunctionInterceptor<BaseType, Name, SetterType>(name, setter);

    this.getter.setData(ATTRIBUTE_INTERCEPTOR_PROP_NAME, this);
    this.setter.setData(ATTRIBUTE_INTERCEPTOR_PROP_NAME, this);
  }
}

export class AttributeInterceptor<
  BaseType extends { [key: string]: any },
  Name extends string,
  GetAttrType = BaseType[Name],
  SetAttrType = GetAttrType
> extends AttributeInterceptorBase<
  BaseType,
  Name,
  (this: BaseType) => GetAttrType,
  (this: BaseType, value: SetAttrType) => void
> {
  constructor(name: Name, shadowPrototype: ShadowPrototype<BaseType>, desc?: ExtendedPropertyDescriptor) {
    super(name);

    this.interceptProperty(shadowPrototype.targetPrototype, false, desc);

    if (this.status !== InterceptionStatus.Intercepted) {
      shadowPrototype.addPendingPropertyInterceptor(this);
    }
  }

  private interceptProperty(obj: object, isOwnProperty: boolean, desc?: ExtendedPropertyDescriptor) {
    desc = desc ?? getExtendedPropertyDescriptor(obj, this.name);
    if (isOwnProperty) {
      let virtualProperty: any; // TODO: we should do this on the object itself
      const get = function () {
        return virtualProperty;
      };
      const set = function (value: any) {
        virtualProperty = value;
      }
      if (desc) {
        if (desc.value && desc.writable) { // it has value and can change
          virtualProperty = desc.value;
          delete desc.value;
          delete desc.writable;
          desc.get = get;
          desc.set = set;
          desc.configurable = true;
        }
      } else {
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
          desc.set = this.setter.interceptor
        }
        __DEV__ && assert(desc.configurable, `Cannot intercept attribute ${this.name}`);
        defineProperty(desc.container, this.name, desc);
        if (__DEV__) {
          const desc = getExtendedPropertyDescriptor(obj, this.name);
          assert(desc?.get === this.getter.interceptor, `getter interceptor did not work`);
          assert(desc?.set === this.setter.interceptor, `setter interceptor did not work`);
        }
        this.status = desc.configurable ? InterceptionStatus.Intercepted : InterceptionStatus.NotConfigurable;
      } else if (desc.value) {
        //TODO: we should replace this one with get/set
        console.warn(`Property ${this.name} does not seem to be an attribute`);
        this.status = InterceptionStatus.NoGetterSetter;
      } else {
        if (__DEV__) {
          if (hasOwnProperty(desc, "get") || hasOwnProperty(desc, "set")) {
            console.warn(`Un expected situation, attribute ${this.name} does not have getter/setter defined`);

          }
        }
      }
    } else {
      this.status = InterceptionStatus.NotFound;
    }
  }

  interceptObjectOwnProperties(obj: object) {
    return this.interceptProperty(obj, true);
  }

}

function getAttributeInterceptor<
  BaseType extends { [key: string]: any },
  Name extends string,
  GetAttrType = BaseType[Name],
  SetAttrType = GetAttrType,
  AttrInterceptorType extends AttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType> = AttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType>,
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>,
): ExtendedPropertyDescriptor<AttrInterceptorType> | undefined {
  const desc = getExtendedPropertyDescriptor<AttrInterceptorType>(shadowPrototype.targetPrototype, name);
  if (desc) {
    /**
     * let's try getter/setter as well.
     * we know this is special case (see above) and interceptor is really about the actual func, not its getter/setters
     * so, we need to supress the type of getter/setter
     */
    const getFI = getFunctionInterceptor(desc.get);
    const setFI = getFunctionInterceptor(desc.set);
    const getAI = getFI?.getData<AttrInterceptorType | undefined | null>(ATTRIBUTE_INTERCEPTOR_PROP_NAME);
    const setAI = setFI?.getData<AttrInterceptorType | undefined | null>(ATTRIBUTE_INTERCEPTOR_PROP_NAME);

    assert(!(getAI && setAI) || (getAI === setAI), `Getter/Setter of attribute ${name} have differnt interceptors`);
    desc.interceptor = getAI ?? setAI;
  }
  return desc;
}

export function interceptAttributeBase<
  BaseType extends { [key: string]: any },
  Name extends string,
  GetAttrType = BaseType[Name],
  SetAttrType = GetAttrType,
  AttrInterceptor extends AttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType> = AttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType>,
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>,
  attributeInterceptorCtor: new (name: Name, shadowPrototype: ShadowPrototype<BaseType>, desc?: ExtendedPropertyDescriptor) => AttrInterceptor
): AttrInterceptor {
  const desc = getAttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType, AttrInterceptor>(name, shadowPrototype);
  return desc?.interceptor ?? new attributeInterceptorCtor(name, shadowPrototype, desc);
}

export function interceptAttribute<
  BaseType extends { [key: string]: any },
  Name extends string,
  GetAttrType = BaseType[Name],
  SetAttrType = GetAttrType,
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>
): AttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType> {
  return interceptAttributeBase<BaseType, Name, GetAttrType, SetAttrType>(name, shadowPrototype, AttributeInterceptor);
}