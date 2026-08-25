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
  private readonly inheritedProperties: Record<string, unknown>;
  private locked = false;
  private readonly children = new Map<string, Child>();

  constructor(
    public readonly surface: string | null,
    public readonly parent: ALSurfaceHierarchyNode<Child> | null
  ) {
    this.inheritedProperties = Object.create(
      parent?.inheritedProperties ?? null
    ) as Record<string, unknown>;
  }

  getChild(surfaceName: string): Child | null {
    return this.children.get(surfaceName) ?? null;
  }

  getChildren(): Child[] {
    return Array.from(this.children.values());
  }

  addChild(child: Child): void {
    this.children.set(child.surfaceName, child);
  }

  removeChild(child: Child): boolean {
    return this.children.delete(child.surfaceName);
  }

  isRemovable(): boolean {
    return this.children.size === 0 && !this.locked;
  }

  remove(): boolean {
    return this.isRemovable();
  }

  getInheritedPropery<T>(propName: string): T | undefined | null {
    return this.inheritedProperties[propName] as T | undefined | null;
  }

  setInheritedPropery<T>(propName: string, propValue: T): T {
    this.inheritedProperties[propName] = propValue;
    this.locked = true;
    return propValue;
  }
}
