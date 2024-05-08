/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { AUTO_LOGGING_SURFACE, SURFACE_WRAPPER_ATTRIBUTE_NAME } from './ALSurfaceConsts';


export function getSurfacePath(node: HTMLElement | null): string | null {
  return getAncestralSurfaceNode(node)?.getAttribute(AUTO_LOGGING_SURFACE) ?? null;
}

export function getAncestralSurfaceNode(node: Element | null): Element | null {
  return node?.closest(`[${AUTO_LOGGING_SURFACE}]`) ?? null;
}

export function getElementSurface(node: Element | null): string | null {
  return node?.getAttribute(AUTO_LOGGING_SURFACE) ?? null;
}

export function getElementsWithSurfaces(): NodeListOf<Element> {
  return document.querySelectorAll(`[${AUTO_LOGGING_SURFACE}]`);
}

export function isSurfaceWrapper(node: HTMLElement): boolean {
  return node.getAttribute(SURFACE_WRAPPER_ATTRIBUTE_NAME) === '1';
}