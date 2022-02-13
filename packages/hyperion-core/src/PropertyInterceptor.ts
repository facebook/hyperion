import { assert } from "@hyperion/global"

export class PropertyInterceptor {
  constructor(public name: string) {
    /* __DEV__ &&  */assert(!!this.name, "Interceptor name should have value");
  }
}


interface ExtendedPropertyDescriptor extends PropertyDescriptor {
  container: Object;
}

/**
  * Searches the object or its prototype chain for a given property name
  * and the actual object that has the property is stores in the .container
  * field.
  */
export function getExtendedPropertyDescriptor(obj: Object, propName: string): ExtendedPropertyDescriptor | undefined {
  let desc: ExtendedPropertyDescriptor | undefined;
  while (obj && !desc) {
    desc = Object.getOwnPropertyDescriptor(obj, propName) as ExtendedPropertyDescriptor;
    if (desc) {
      desc.container = obj;
    }
    obj = Object.getPrototypeOf(obj);
  }
  return desc;
}


export function defineProperty(obj: Object, propName: string, desc: PropertyDescriptor) {
  __DEV__ && assert(!!desc, "invalid proper description");
  try {
    Object.defineProperty(obj, propName, desc);
  } catch (e) {
    __DEV__ && console.warn(propName, " defining throws exception : ", e, " on ", obj);
  }
}

