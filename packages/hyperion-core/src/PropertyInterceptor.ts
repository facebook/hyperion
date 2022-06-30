/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global"


export const enum InterceptionStatus {
  Unknown,
  Intercepted,
  NotFound,
  NoGetterSetter,
  NotConfigurable
}

export abstract class PropertyInterceptor {
  public status = InterceptionStatus.Unknown;

  constructor(public name: string) {
    __DEV__ && assert(!!this.name, "Interceptor name should have value");
  }

  interceptObjectOwnProperties(_obj: object) {
    __DEV__ && assert(false, `This method must be overriden`);
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


const ObjectHasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(obj: Object, propName: string): boolean {
  return ObjectHasOwnProperty.call(obj, propName);
}

type ObjectOrFunction = Object & Partial<Pick<Function, "prototype" | "name">>;
export function copyOwnProperties<T extends ObjectOrFunction>(src: T, dest: T, copySpecials = false) {

  if (!src || !dest) {
    // Not much to copy. This can legitimately happen if for example function/attribute value is undefined during interception.
    return;
  }

  const ownProps = Object.getOwnPropertyNames(src);
  for (let i = 0, length = ownProps.length; i < length; ++i) {
    const propName = ownProps[i];
    if (!(propName in dest)) {
      const desc = Object.getOwnPropertyDescriptor(src, propName) as PropertyDecorator; //Since we are iterating the getOwnPropertyNames, we know this must have value
      assert(desc != null, `Unexpected situation, we should have own property for ${propName}`);
      try {
        Object.defineProperty(dest, propName, desc);
      } catch (e) {
        __DEV__ && console.error("Adding property ", propName, " throws exception: ", e);
      }
    }
  }

  if (copySpecials) {
    dest.toString = function () {
      return src.toString();
    }
    if (Object.hasOwn(src, 'valueOf')) {
      dest.valueOf = function () {
        return src.valueOf();
      }
    }
  }
}
