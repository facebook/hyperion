/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export interface ALSurfaceHierarchyChild {
  readonly surfaceName: string;
}

export interface ALSurfaceHierarchyNodeContract<
  Child extends ALSurfaceHierarchyChild
> {
  readonly surface: string | null;
  readonly parent: ALSurfaceHierarchyNodeContract<Child> | null;
  getChild(surfaceName: string): Child | null;
  getChildren(): Child[];
  addChild(child: Child): void;
  removeChild(child: Child): boolean;
  isRemovable(): boolean;
  remove(): boolean;
  getInheritedPropery<T>(propName: string): T | undefined | null;
  setInheritedPropery<T>(propName: string, propValue: T): T;
}

export abstract class ALSurfaceHierarchyNode<
  Child extends ALSurfaceHierarchyChild
> implements ALSurfaceHierarchyNodeContract<Child>
{
  private readonly __ext: Record<string, unknown>;
  #locked = false;
  private readonly childrenMap = new Map<string, Child>();

  constructor(
    public readonly surface: string | null,
    public readonly parent: ALSurfaceHierarchyNode<Child> | null
  ) {
    this.__ext = Object.create(parent?.__ext ?? null) as Record<
      string,
      unknown
    >;
  }

  getChild(surfaceName: string): Child | null {
    return this.childrenMap.get(surfaceName) ?? null;
  }

  getChildren(): Child[] {
    return Array.from(this.childrenMap.values());
  }

  addChild(child: Child): void {
    this.childrenMap.set(child.surfaceName, child);
  }

  removeChild(child: Child): boolean {
    return this.childrenMap.delete(child.surfaceName);
  }

  isRemovable(): boolean {
    return this.childrenMap.size === 0 && !this.#locked;
  }

  remove(): boolean {
    return this.isRemovable();
  }

  getInheritedPropery<T>(propName: string): T | undefined | null {
    return this.__ext[propName] as T | undefined | null;
  }

  setInheritedPropery<T>(propName: string, propValue: T): T {
    this.__ext[propName] = propValue;
    this.#locked = true;
    return propValue;
  }
}
