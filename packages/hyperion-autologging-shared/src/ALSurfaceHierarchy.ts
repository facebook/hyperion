/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export interface ALSurfaceHierarchyChild {
  readonly surfaceName: string;
}

const childrenByNode = new WeakMap<
  object,
  Map<string, ALSurfaceHierarchyChild>
>();
const inheritedPropertiesByNode = new WeakMap<object, Map<string, unknown>>();
const lockedNodes = new WeakSet<object>();

export abstract class ALSurfaceHierarchyNode<
  Child extends ALSurfaceHierarchyChild
> {
  constructor(
    public readonly surface: string | null,
    public readonly parent: ALSurfaceHierarchyNode<Child> | null
  ) {
    childrenByNode.set(this, new Map());
    inheritedPropertiesByNode.set(this, new Map());
  }

  getChild(surfaceName: string): Child | null {
    return (childrenByNode.get(this)?.get(surfaceName) as Child) ?? null;
  }

  getChildren(): Child[] {
    return Array.from(childrenByNode.get(this)?.values() ?? []) as Child[];
  }

  addChild(child: Child): void {
    childrenByNode.get(this)?.set(child.surfaceName, child);
  }

  removeChild(child: Child): boolean {
    const children = childrenByNode.get(this);
    if (children?.get(child.surfaceName) !== child) return false;
    return children.delete(child.surfaceName);
  }

  isRemovable(): boolean {
    return (
      (childrenByNode.get(this)?.size ?? 0) === 0 && !lockedNodes.has(this)
    );
  }

  remove(): boolean {
    return this.isRemovable();
  }

  getInheritedPropery<T>(propName: string): T | undefined | null {
    const properties = inheritedPropertiesByNode.get(this);
    if (properties?.has(propName)) return properties.get(propName) as T;
    return this.parent?.getInheritedPropery<T>(propName);
  }

  setInheritedPropery<T>(propName: string, propValue: T): T {
    inheritedPropertiesByNode.get(this)?.set(propName, propValue);
    lockedNodes.add(this);
    return propValue;
  }
}
