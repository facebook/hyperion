/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 *
 * @jest-environment node
 */

'use strict';

import { ALSurfaceHierarchyNode } from '../src/ALSurfaceHierarchy';

class TestSurfaceNode extends ALSurfaceHierarchyNode<TestSurfaceNode> {
  constructor(
    public readonly surfaceName: string,
    surface: string | null,
    parent: TestSurfaceNode | null
  ) {
    super(surface, parent);
  }
}

describe('ALSurfaceHierarchyNode', () => {
  test('uses name-keyed Map replacement and removal semantics', () => {
    const root = new TestSurfaceNode('root', null, null);
    const first = new TestSurfaceNode('child', '/first', root);
    const second = new TestSurfaceNode('child', '/second', root);

    root.addChild(first);
    root.addChild(second);

    expect(root.getChild('child')).toBe(second);
    expect(root.getChildren()).toEqual([second]);
    expect(root.removeChild(first)).toBe(true);
    expect(root.getChild('child')).toBeNull();
  });

  test('preserves insertion order for distinct children', () => {
    const root = new TestSurfaceNode('root', null, null);
    const first = new TestSurfaceNode('first', '/first', root);
    const second = new TestSurfaceNode('second', '/second', root);

    root.addChild(first);
    root.addChild(second);

    expect(root.getChildren()).toEqual([first, second]);
  });

  test('inherits later parent values and preserves child overrides', () => {
    const root = new TestSurfaceNode('root', null, null);
    const child = new TestSurfaceNode('child', '/child', root);

    root.setInheritedPropery('value', 'first');
    expect(child.getInheritedPropery('value')).toBe('first');
    root.setInheritedPropery('value', 'second');
    expect(child.getInheritedPropery('value')).toBe('second');
    child.setInheritedPropery('value', 'child');
    root.setInheritedPropery('value', 'third');

    expect(root.getInheritedPropery('value')).toBe('third');
    expect(child.getInheritedPropery('value')).toBe('child');
  });

  test('locks nodes with inherited data and tracks child removability', () => {
    const root = new TestSurfaceNode('root', null, null);
    const child = new TestSurfaceNode('child', '/child', root);

    expect(root.isRemovable()).toBe(true);
    root.addChild(child);
    expect(root.isRemovable()).toBe(false);
    expect(child.remove()).toBe(true);
    expect(root.removeChild(child)).toBe(true);
    expect(root.isRemovable()).toBe(true);

    root.setInheritedPropery('locked', true);
    expect(root.isRemovable()).toBe(false);
    expect(root.remove()).toBe(false);
  });
});
