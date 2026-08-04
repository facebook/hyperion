/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { ALSurfaceHierarchyNode } from 'hyperion-autologging-shared';
import { getALRuntimeChannel } from './ALChannel';
import { getExplicitText, mergeMetadata } from './ALMetadata';
import type { SurfaceMetadata, UIEventMetadata } from './ALTypes';

const EMPTY_ELEMENTS: readonly never[] = Object.freeze([]);
const surfaceByPath = new Map<string, ALSurfaceDataNode>();
const registryKeysBySurface = new WeakMap<
  ALSurfaceDataNode,
  readonly string[]
>();

export class ALSurfaceDataRoot extends ALSurfaceHierarchyNode<ALSurfaceDataNode> {
  readonly surface = null;
  readonly parent = null;

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
  readonly surface: string;
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

function registerSurfaceData(data: ALSurfaceDataNode): void {
  data.parent.addChild(data);
  const keys = data.nonInteractive
    ? [data.nonInteractiveSurface]
    : data.surface === data.nonInteractiveSurface
    ? [data.nonInteractiveSurface]
    : [data.nonInteractiveSurface, data.surface];
  registryKeysBySurface.set(data, keys);
  for (const key of keys) surfaceByPath.set(key, data);
}

function unregisterSurfaceData(data: ALSurfaceDataNode): void {
  data.parent.removeChild(data);
  for (const key of registryKeysBySurface.get(data) ?? []) {
    if (surfaceByPath.get(key) === data) surfaceByPath.delete(key);
  }
  registryKeysBySurface.delete(data);
}

export function resetALSurfaceDataForTests(): void {
  surfaceByPath.clear();
  for (const child of root.getChildren()) root.removeChild(child);
}

const SurfaceContext = createContext<ALSurfaceDataNode | null>(null);

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

export interface ALSurfaceProps {
  children?: React.ReactNode;
  name: string;
  metadata?: SurfaceMetadata;
  uiEventMetadata?: UIEventMetadata;
  trackMount?: boolean;
  nonInteractive?: boolean;
}

interface PendingUnmount {
  cancel(): void;
  run(): void;
}

interface SurfaceLifecycleState {
  mounted: boolean;
  data?: ALSurfaceDataNode;
  mountTime?: number;
  snapshotKey?: string;
  pendingUnmount?: PendingUnmount;
}

export function ALSurface({
  name,
  children,
  metadata,
  uiEventMetadata,
  trackMount = true,
  nonInteractive = false,
}: ALSurfaceProps): React.ReactElement {
  const parentSurface = useSurface();
  const lifecycleState = useRef<SurfaceLifecycleState>({ mounted: false });
  const surfaceName = getExplicitText(name) ?? '(anonymous)';
  const path = parentSurface
    ? `${parentSurface.nonInteractiveSurface}/${surfaceName}`
    : surfaceName;
  const interactivePath = nonInteractive
    ? parentSurface?.surface ?? ''
    : parentSurface?.surface
    ? `${parentSurface.surface}/${surfaceName}`
    : surfaceName;
  const mergedMetadata = mergeMetadata(
    parentSurface?.metadata,
    metadata
  );
  const mergedInteractiveMetadata = nonInteractive
    ? parentSurface?.interactiveMetadata ?? {}
    : mergeMetadata(parentSurface?.interactiveMetadata, metadata);
  const mergedUIEventMetadata: Record<string, SurfaceMetadata> = {
    ...(parentSurface?.uiEventMetadata ?? {}),
  };
  if (!nonInteractive && uiEventMetadata != null) {
    for (const eventName of Object.keys(uiEventMetadata)) {
      mergedUIEventMetadata[eventName] = mergeMetadata(
        parentSurface?.uiEventMetadata[eventName],
        uiEventMetadata[eventName]
      );
    }
  }

  const lifecycleMetadata = serializeMetadata(mergedMetadata);
  const interactiveMetadataSnapshot = serializeMetadata(
    mergedInteractiveMetadata
  );
  const uiEventMetadataSnapshot = serializeUIEventMetadata(
    mergedUIEventMetadata
  );
  const surfaceData = useMemo(
    () =>
      new ALSurfaceDataNode({
        name: surfaceName,
        path,
        interactivePath,
        depth: (parentSurface?.depth ?? 0) + 1,
        parent: parentSurface ?? root,
        metadata: JSON.parse(lifecycleMetadata) as SurfaceMetadata,
        interactiveMetadata: JSON.parse(
          interactiveMetadataSnapshot
        ) as SurfaceMetadata,
        uiEventMetadata: JSON.parse(uiEventMetadataSnapshot) as UIEventMetadata,
        nonInteractive,
      }),
    [
      interactiveMetadataSnapshot,
      interactivePath,
      lifecycleMetadata,
      nonInteractive,
      parentSurface,
      path,
      surfaceName,
      uiEventMetadataSnapshot,
    ]
  );
  const lifecycleSnapshotKey = `${path}\u0000${lifecycleMetadata}\u0000${trackMount}`;

  useEffect(() => {
    const channel = getALRuntimeChannel();
    const mountTime = Date.now();
    const state = lifecycleState.current;
    if (state.pendingUnmount != null) {
      if (state.snapshotKey === lifecycleSnapshotKey) {
        state.pendingUnmount.cancel();
      } else {
        state.pendingUnmount.run();
      }
      state.pendingUnmount = undefined;
    }
    if (!state.mounted) {
      registerSurfaceData(surfaceData);
      if (trackMount && channel != null) {
        channel.emitSafely('al_surface_mount_request', {
          timestamp: mountTime,
          instance: surfaceData,
          surface: surfaceData.surfaceName,
          surfacePath: surfaceData.nonInteractiveSurface,
          surfaceData,
          metadata: surfaceData.metadata,
        });
      }
      state.mounted = true;
      state.data = surfaceData;
      state.mountTime = mountTime;
      state.snapshotKey = lifecycleSnapshotKey;
    }

    return () => {
      const timestamp = Date.now();
      let cancelled = false;
      const run = () => {
        if (cancelled || !state.mounted || state.data !== surfaceData) return;
        if (trackMount && channel != null) {
          channel.emitSafely('al_surface_unmount_request', {
            timestamp,
            instance: surfaceData,
            surface: surfaceData.surfaceName,
            surfacePath: surfaceData.nonInteractiveSurface,
            surfaceData,
            metadata: surfaceData.metadata,
            mountedDuration:
              (timestamp - (state.mountTime ?? timestamp)) / 1000,
          });
        }
        unregisterSurfaceData(surfaceData);
        state.mounted = false;
        state.data = undefined;
        state.mountTime = undefined;
      };
      const isDevelopment =
        (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ ===
        true;
      if (isDevelopment) {
        const pendingUnmount = {
          cancel: () => {
            cancelled = true;
          },
          run,
        };
        state.pendingUnmount = pendingUnmount;
        void Promise.resolve().then(() => {
          pendingUnmount.run();
          if (state.pendingUnmount === pendingUnmount) {
            state.pendingUnmount = undefined;
          }
        });
      } else {
        run();
      }
    };
  }, [lifecycleSnapshotKey, surfaceData, trackMount]);

  return React.createElement(
    SurfaceContext.Provider,
    { value: surfaceData },
    children
  );
}

function serializeMetadata(metadata: SurfaceMetadata): string {
  const sorted: Record<string, string | number | boolean | null> = {};
  for (const key of Object.keys(metadata).sort()) sorted[key] = metadata[key];
  return JSON.stringify(sorted);
}

function serializeUIEventMetadata(metadata: UIEventMetadata): string {
  const sorted: Record<string, SurfaceMetadata> = {};
  for (const eventName of Object.keys(metadata).sort()) {
    sorted[eventName] = JSON.parse(
      serializeMetadata(metadata[eventName])
    ) as SurfaceMetadata;
  }
  return JSON.stringify(sorted);
}
