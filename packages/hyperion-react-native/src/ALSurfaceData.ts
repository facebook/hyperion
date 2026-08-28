/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ALSurfaceHierarchyNode } from 'hyperion-autologging/src/ALSurfaceHierarchy';
import type { SurfaceMetadata, UIEventMetadata } from './ALSharedTypes';

declare const __DEV__: boolean;

const EMPTY_ELEMENTS: readonly never[] = Object.freeze([]);
const surfaceByPath = new Map<string, ALSurfaceDataNode>();

export class ALSurfaceDataRoot extends ALSurfaceHierarchyNode<ALSurfaceDataNode> {
  override readonly surface = null;
  override readonly parent = null;

  constructor() {
    super(null, null);
  }

  getElements(): readonly never[] {
    return EMPTY_ELEMENTS;
  }

  toJSON(): { surface: null } {
    return { surface: null };
  }

  override isRemovable(): boolean {
    return false;
  }
}

export class ALSurfaceDataNode extends ALSurfaceHierarchyNode<ALSurfaceDataNode> {
  override readonly parent: ALSurfaceDataNode | ALSurfaceDataRoot;
  override readonly surface: string;
  readonly name: string;
  readonly path: string;
  readonly interactivePath: string;
  readonly depth: number;
  readonly surfaceName: string;
  readonly nonInteractiveSurface: string;
  readonly nonInteractive: boolean;
  readonly metadata: SurfaceMetadata;
  readonly interactiveMetadata: SurfaceMetadata;
  readonly uiEventMetadata: UIEventMetadata;

  constructor(options: {
    name: string;
    path: string;
    interactivePath: string;
    depth: number;
    parent: ALSurfaceDataNode | ALSurfaceDataRoot;
    nonInteractive: boolean;
    metadata: SurfaceMetadata;
    interactiveMetadata: SurfaceMetadata;
    uiEventMetadata: UIEventMetadata;
  }) {
    super(options.interactivePath, options.parent);
    this.parent = options.parent;
    this.surface = options.interactivePath;
    this.name = options.name;
    this.path = options.path;
    this.interactivePath = options.interactivePath;
    this.depth = options.depth;
    this.surfaceName = options.name;
    this.nonInteractiveSurface = options.path;
    this.nonInteractive = options.nonInteractive;
    this.metadata = options.metadata;
    this.interactiveMetadata = options.interactiveMetadata;
    this.uiEventMetadata = options.uiEventMetadata;
  }

  getElements(): readonly never[] {
    return EMPTY_ELEMENTS;
  }

  getInheriteUIEventMetadata(eventName: string): SurfaceMetadata | null {
    return this.uiEventMetadata[eventName] ?? null;
  }

  toJSON(): Record<string, unknown> {
    return {
      depth: this.depth,
      metadata: this.metadata,
      nonInteractive: this.nonInteractive,
      nonInteractiveSurface: this.nonInteractiveSurface,
      parentSurface: this.parent.surface,
      surface: this.surface,
      surfaceName: this.surfaceName,
    };
  }
}

const root = new ALSurfaceDataRoot();

export const ALSurfaceData = Object.freeze({
  root,
  get(path: string): ALSurfaceDataNode {
    const data = surfaceByPath.get(path);
    if (data == null) {
      throw new Error(`Unknown AutoLogging surface: ${path}`);
    }
    return data;
  },
  tryGet(path: string): ALSurfaceDataNode | undefined {
    return surfaceByPath.get(path);
  },
});

export function registerSurfaceData(data: ALSurfaceDataNode): void {
  if (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    data.parent.getChild(data.surfaceName) != null
  ) {
    console.error(
      `Duplicate AutoLogging surface name "${data.surfaceName}" under "${
        data.parent.surface ?? 'root'
      }".`
    );
  }
  data.parent.addChild(data);
  surfaceByPath.set(data.nonInteractiveSurface, data);
  if (!data.nonInteractive && data.surface !== data.nonInteractiveSurface) {
    surfaceByPath.set(data.surface, data);
  }
}

export function unregisterSurfaceData(data: ALSurfaceDataNode): void {
  data.parent.removeChild(data);
  if (surfaceByPath.get(data.nonInteractiveSurface) === data) {
    surfaceByPath.delete(data.nonInteractiveSurface);
  }
  if (
    data.surface !== data.nonInteractiveSurface &&
    surfaceByPath.get(data.surface) === data
  ) {
    surfaceByPath.delete(data.surface);
  }
}

export function clearSurfaceData(): void {
  surfaceByPath.clear();
  for (const child of root.getChildren()) root.removeChild(child);
}
