/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { AUTO_LOGGING_NON_INTERACTIVE_SURFACE, AUTO_LOGGING_SURFACE, SURFACE_WRAPPER_ATTRIBUTE_NAME } from './ALSurfaceConsts';


/// Get containing surface string for an element
export function getSurfacePath(node: Element | null): string | null {
  return getAncestralSurfaceNode(node)?.getAttribute(AUTO_LOGGING_SURFACE) ?? null;
}

/// Get containing surface element for an element
export function getAncestralSurfaceNode(node: Element | null): Element | null {
  return node?.closest(`[${AUTO_LOGGING_SURFACE}]`) ?? null;
}

/// Get surface string for a surface element
export function getElementSurface(node: Element | null): string | null {
  return node?.getAttribute(AUTO_LOGGING_SURFACE) ?? null;
}

/// Get all surface elements in the document
export function getElementsWithSurfaces(): NodeListOf<Element> {
  return document.querySelectorAll(`[${AUTO_LOGGING_SURFACE}]`);
}

/// Check if the element is a surface wrapper element
export function isSurfaceWrapper(node: Element): boolean {
  return node.getAttribute(SURFACE_WRAPPER_ATTRIBUTE_NAME) === '1';
}

/// Get all surface elements matching the given surface string
export function getSurfaceElement(surface: string): Element[] {
  return Array.from(document.querySelectorAll(`[${AUTO_LOGGING_SURFACE}="${surface}"],[${AUTO_LOGGING_NON_INTERACTIVE_SURFACE}="${surface}"]`));
}
