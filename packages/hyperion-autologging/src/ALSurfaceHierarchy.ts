/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export interface ALSurfaceHierarchyChild {
  readonly surfaceName: string;
}

export abstract class ALSurfaceHierarchyNode<
  Child extends ALSurfaceHierarchyChild,
> {
  private readonly inheritedProperties: Record<string, unknown>;
  private readonly childrenMap = new Map<string, Child>();
  private locked = false;

  constructor(
    public readonly surface: string | null,
    public readonly parent: ALSurfaceHierarchyNode<Child> | null,
  ) {
    this.inheritedProperties = Object.create(
      parent?.inheritedProperties ?? null,
    );
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
    return this.childrenMap.size === 0 && !this.locked;
  }

  remove(): boolean {
    return this.isRemovable();
  }

  getInheritedPropery<T>(propName: string): T | undefined | null {
    return this.inheritedProperties[propName] as T | undefined;
  }

  setInheritedPropery<T>(propName: string, propValue: T): T {
    this.inheritedProperties[propName] = propValue;
    this.locked = true;
    return propValue;
  }
}
