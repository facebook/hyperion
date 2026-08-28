/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { createContext, useContext } from 'react';
import type { SurfaceMetadata, UIEventMetadata } from './ALSharedTypes';
import type { ALSurfaceDataNode } from './ALSurfaceData';

export const SurfaceContext = createContext<ALSurfaceDataNode | null>(null);

export function useSurface(): ALSurfaceDataNode | null {
  return useContext(SurfaceContext);
}

export function useSurfacePath(): string {
  return useSurface()?.surface ?? '';
}

export function useSurfaceMetadata(): SurfaceMetadata {
  return useSurface()?.metadata ?? {};
}

export function useSurfaceUIEventMetadata(): UIEventMetadata {
  return useSurface()?.uiEventMetadata ?? {};
}
