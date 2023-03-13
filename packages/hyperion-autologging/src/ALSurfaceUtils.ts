/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export function getSurfacePath(node: HTMLElement | null, domSurfaceAttributeName: string): string| null {
  const domSurfaceSelector = `[${domSurfaceAttributeName}]`;
  return getAncestralSurfaceNode(node, domSurfaceSelector)?.getAttribute(domSurfaceAttributeName) ?? null;
}

export function getAncestralSurfaceNode(node: Element | null, domSurfaceSelector: string): Element| null {
  return node?.closest(domSurfaceSelector) ?? null;
}
