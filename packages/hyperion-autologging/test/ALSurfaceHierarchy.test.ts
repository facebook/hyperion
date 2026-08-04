/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ALSurfaceHierarchyNode } from '../src/ALSurfaceHierarchy';

class TestSurfaceNode extends ALSurfaceHierarchyNode<TestSurfaceNode> {
  constructor(
    public readonly surfaceName: string,
    parent: TestSurfaceNode | null = null
  ) {
    super(surfaceName, parent);
  }
}

describe('ALSurfaceHierarchyNode', () => {
  it('keeps one direct child per surface name', () => {
    const parent = new TestSurfaceNode('parent');
    const first = new TestSurfaceNode('child', parent);
    const replacement = new TestSurfaceNode('child', parent);

    parent.addChild(first);
    parent.addChild(replacement);

    expect(parent.getChild('child')).toBe(replacement);
    expect(parent.getChildren()).toEqual([replacement]);
  });

  it('does not let stale cleanup remove a replacement child', () => {
    const parent = new TestSurfaceNode('parent');
    const first = new TestSurfaceNode('child', parent);
    const replacement = new TestSurfaceNode('child', parent);

    parent.addChild(first);
    parent.addChild(replacement);

    expect(parent.removeChild(first)).toBe(false);
    expect(parent.getChild('child')).toBe(replacement);
    expect(parent.removeChild(replacement)).toBe(true);
    expect(parent.getChild('child')).toBeNull();
  });
});
