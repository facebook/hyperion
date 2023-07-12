/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { hasOwnProperty } from "./PropertyInterceptor";
import { ShadowPrototype } from "./ShadowPrototype";

/**
 * Intercepted objects may carry extra information to link them to the intercepted logic
 * They may also carry other virtualized values.
 * This is analogous to the shadow concept in the dom.
 */
interface IExtension {
  readonly virtualPropertyValues: { [name: string]: unknown },
  readonly shadowPrototype: ShadowPrototype,
  readonly id: number,
}

type ExtensibleObject = Object & Record<string, any>;

const ExtensionPropName = "__ext";
const ShadowPrototypePropName = "__sproto";
let extensionId = 0;

type ExtensiblePrototypeObject = Object & Partial<Record<typeof ShadowPrototypePropName, ShadowPrototype>>;

type ShadowPrototypeGetter = (protoObj: ExtensiblePrototypeObject) => ShadowPrototype | null | undefined
const shadowPrototypeGetters: ShadowPrototypeGetter[] = [];
/**
 * @param getter function to map a given object to a shadow prototype
 * @returns a function that can remove the getter.
 */
export function registerShadowPrototypeGetter(getter: ShadowPrototypeGetter): () => void {
  shadowPrototypeGetters.push(getter);
  return (() => {
    const index = shadowPrototypeGetters.indexOf(getter);
    if (index > -1) {
      shadowPrototypeGetters.splice(index, 1);
    }
  });
}

export function getOwnShadowPrototypeOf<T extends ShadowPrototype>(protoObj: ExtensiblePrototypeObject): T | null | undefined {
  const shadowProto = Object.getOwnPropertyDescriptor(protoObj, ShadowPrototypePropName);
  return shadowProto?.value;
}

/**
 * intercept function can look up the prototype chain to find a proper ShadowPrototype for intercepting
 * a given object.
 * You should be careful to call this function on non-leaf nodes of the prototype chain.
 * This will be the last priority after the shadowPrototypeGetters is tried
 */
export function registerShadowPrototype<T extends ShadowPrototype>(protoObj: ExtensiblePrototypeObject, shadowPrototype: T): T {
  __DEV__ && assert(
    !protoObj[ShadowPrototypePropName],
    `hiding existing ShadowPrototype in the chain of prototype ${protoObj}.`,
    { logger: { error: msg => console.debug(msg) } }
  );
  Object.defineProperty(protoObj, ShadowPrototypePropName, {
    value: shadowPrototype,
    // configurable: true,
  });
  return shadowPrototype;
}

let cachedPropertyDescriptor: PropertyDescriptor = {
  /** Want all the following fields to be false, but should not specify explicitly
   * enumerable: false,
   * writable: false,
   * configurable: false
   */
};

function isInterceptable(value: any): boolean {
  /**
   * Generally we want to intercept objects and functions
   * Html tags are generally object, but some browsers use function for tags such as <object>, <embed>, ...
   */
  let typeofValue = typeof value;
  return value &&
    (typeofValue === "object" || typeofValue === "function");
}

export function isIntercepted(value: any): boolean {
  return hasOwnProperty(value, ExtensionPropName);
}

export function intercept(value: any, shadowPrototype?: ShadowPrototype | null): typeof value {
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
      let extension: IExtension = {
        virtualPropertyValues: {},
        shadowPrototype: shadowProto,
        id: extensionId++,
      }
      cachedPropertyDescriptor.value = extension;
      Object.defineProperty(value, ExtensionPropName, cachedPropertyDescriptor); // has to be done before interception starts
      shadowProto.interceptObject(value);
    }

  }
  return value;
}

export function getObjectExtension<T = IExtension>(obj: ExtensibleObject, interceptIfAbsent?: boolean): IExtension & T {
  __DEV__ && assert(isInterceptable(obj), "Only objects or functions are allowed");
  let ext = obj[ExtensionPropName];
  if (!ext && interceptIfAbsent) {
    intercept(obj);
    ext = obj[ExtensionPropName];
  }
  return ext;
}

export function getVirtualProperty<T>(obj: ExtensibleObject, propName: string): T | undefined {
  const ext = getObjectExtension(obj, true);
  return ext?.shadowPrototype.getVirtualProperty<T>(propName);
}

export function getVirtualPropertyValue<T>(obj: ExtensibleObject, propName: string): T | undefined {
  const ext = getObjectExtension(obj, true);
  return <T | undefined>ext?.virtualPropertyValues[propName]
}

export function setVirtualPropertyValue<T>(obj: ExtensibleObject, propName: string, value: T): T {
  const ext = getObjectExtension(obj, true);
  if (ext) {
    ext.virtualPropertyValues[propName] = value;
  } else {
    assert(!!ext, `Could not get extension for the object`);
  }
  return value;
}
