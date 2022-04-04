/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { hasOwnProperty, PropertyInterceptor } from "./PropertyInterceptor";


/// Items that can show up in virtual table
interface VirtualProperty { }

/**
 * virtual table that matches the prototype chain in the shadow
 */
interface VirtualTable {
  [name: string]: VirtualProperty;
}

/**
 * captures both VirtualTable and any other item that we want to
 * allow in the inheritance chain of the shadow prototype
 */
type Extension = VirtualTable & {
  useCaseInsensitivePropertyName?: boolean
};


function getVirtualPropertyName(name: string, extension: Extension): string {
  return extension?.useCaseInsensitivePropertyName ? ('' + name).toLocaleLowerCase() : name;
}

export class ShadowPrototype<ObjectType extends Object = any, ParentType extends Object = any> {
  readonly extension: Extension;
  readonly onBeforInterceptObj = new Hook<(obj: ObjectType) => void>();
  readonly onAfterInterceptObj = new Hook<(obj: ObjectType) => void>();
  private pendingPropertyInterceptors?: PropertyInterceptor[];

  constructor(
    public readonly targetPrototype: ObjectType,
    private readonly parentShadoPrototype: ShadowPrototype<ParentType> | null,
  ) {
    /**
     * TODO: if we could say <ObjectType extends ParentType> then may be we could avoid the casts
     * in the following methods
     */
    this.extension = Object.create(parentShadoPrototype?.extension ?? null);

    if (/* __DEV__ && */ this.parentShadoPrototype) {
      let obj: any = this.targetPrototype;
      let proto = this.parentShadoPrototype.targetPrototype;
      let matched = false;
      while (obj && !matched) {
        matched = obj === proto;
        obj = Object.getPrototypeOf(obj);
      }
      assert(matched, `Invalid prototype chain`)
    }
  }

  private callOnBeforeInterceptObject(obj: ObjectType): void {
    this.parentShadoPrototype?.callOnBeforeInterceptObject(obj as unknown as ParentType);
    this.onBeforInterceptObj?.call(obj);
  }

  private callOnAfterInterceptObject(obj: ObjectType): void {
    this.parentShadoPrototype?.callOnAfterInterceptObject(obj as unknown as ParentType);
    this.onAfterInterceptObj?.call(obj);
  }

  protected interceptObjectItself(obj: ObjectType): void {
    this.parentShadoPrototype?.interceptObjectItself(obj as unknown as ParentType);
    // We can make any necessary modificatio to the object itself here
    if (this.pendingPropertyInterceptors) {
      for (const pi of this.pendingPropertyInterceptors) {
        pi.interceptObjectOwnProperties(obj);
      }
    }
  }


  public interceptObject(obj: ObjectType) {
    // This behaves similar to how constructors work, i.e. from parent class to child class
    this.callOnBeforeInterceptObject(obj);
    this.interceptObjectItself(obj);
    this.callOnAfterInterceptObject(obj);
  }

  public addPendingPropertyInterceptor(pi: PropertyInterceptor) {
    if (!this.pendingPropertyInterceptors) {
      this.pendingPropertyInterceptors = [];
    }
    this.pendingPropertyInterceptors.push(pi);
  }

  public getVirtualProperty<T>(name: string): T & VirtualProperty {
    const vtable = this.extension;
    const canonicalName = getVirtualPropertyName(name, vtable);
    return <T>vtable[canonicalName];
  }

  public setVirtualProperty<T>(name: string, virtualProp: T & VirtualProperty): void {
    const vtable = this.extension;
    const canonicalName = getVirtualPropertyName(name, vtable);
    if (__DEV__) {
      assert(!hasOwnProperty(vtable, canonicalName), `Vritual property ${name} already exists`);
      assert(
        !vtable[canonicalName],
        `virtual property ${name} will override the parent's.`,
        { logger: { error(msg) { console.warn(msg) } } }
      );
    }
    vtable[canonicalName] = virtualProp;
  }

  public removeVirtualPropery<T>(name: string, virtualProp: T & VirtualProperty): void {
    const vtable = this.extension;
    const canonicalName = getVirtualPropertyName(name, vtable);
    if (__DEV__) {
      assert(hasOwnProperty(vtable, canonicalName), `Vritual property ${name} does not exists`);
    }
    if (vtable[canonicalName] === virtualProp) {
      delete vtable[canonicalName];
    } else {
      console.error(`Vritual property ${name} does not match and was not deleted`);
    }
  }

}
