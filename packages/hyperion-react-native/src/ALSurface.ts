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
import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type { ALEventFactory } from 'hyperion-autologging/src/ALEventFactory';
import { ALSurfaceHierarchyNode } from 'hyperion-autologging/src/ALSurfaceHierarchy';
import type { ALReactNativePlugin } from './ALRuntime';
import { getExplicitText, mergeMetadata } from './ALMetadata';
import type {
  ALReactNativeEventMap,
  ALSurfaceMutationEventData,
  SurfaceMetadata,
  SurfaceMetadataValue,
  UIEventMetadata,
} from './ALTypes';

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

function registerSurfaceData(data: ALSurfaceDataNode): void {
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

function unregisterSurfaceData(data: ALSurfaceDataNode): void {
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

function clearSurfaceData(): void {
  surfaceByPath.clear();
  for (const child of root.getChildren()) root.removeChild(child);
}

interface SurfaceRuntime {
  active: boolean;
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly eventFactory: ALEventFactory<SurfaceMetadataValue>;
  readonly now: () => number;
  readonly publishMutations: boolean;
  readonly mountIndexes: WeakMap<ALSurfaceDataNode, number>;
}

let surfaceRuntime: SurfaceRuntime | null = null;

export interface ReactNativeSurfacesOptions {
  readonly publishMutations?: boolean;
}

export function reactNativeSurfaces<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(options: ReactNativeSurfacesOptions = {}): ALReactNativePlugin<EventMap> {
  return {
    name: 'react-native-surfaces',
    install(channel, context) {
      const runtime: SurfaceRuntime = {
        active: false,
        channel:
          channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>,
        eventFactory: context.eventFactory,
        now: context.now,
        publishMutations: options.publishMutations !== false,
        mountIndexes: new WeakMap(),
      };
      surfaceRuntime = runtime;
      return {
        start() {
          runtime.active = true;
        },
        dispose() {
          runtime.active = false;
          if (surfaceRuntime === runtime) surfaceRuntime = null;
          clearSurfaceData();
        },
      };
    },
  };
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
  readonly children?: React.ReactNode;
  readonly name: string;
  readonly metadata?: SurfaceMetadata;
  readonly uiEventMetadata?: UIEventMetadata;
  readonly trackMount?: boolean;
  readonly nonInteractive?: boolean;
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
  const mergedMetadata = mergeMetadata(parentSurface?.metadata, metadata);
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
        metadata: mergedMetadata,
        interactiveMetadata: mergedInteractiveMetadata,
        uiEventMetadata: mergedUIEventMetadata,
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
    const runtime = surfaceRuntime;
    const state = lifecycleState.current;
    if (state.pendingUnmount != null) {
      if (state.snapshotKey === lifecycleSnapshotKey) {
        state.pendingUnmount.cancel();
      } else {
        state.pendingUnmount.run();
      }
      state.pendingUnmount = undefined;
    }
    if (!state.mounted && runtime?.active === true) {
      const timestamp = runtime.now();
      registerSurfaceData(surfaceData);
      if (trackMount && runtime.publishMutations) {
        const event: ALSurfaceMutationEventData = {
          ...runtime.eventFactory.createEvent({
            eventTimestamp: timestamp,
            metadata: surfaceData.metadata,
          }),
          event: 'mount_component',
          surface: surfaceData.surfaceName,
          surfacePath: surfaceData.nonInteractiveSurface,
          surfaceData,
        };
        runtime.mountIndexes.set(surfaceData, event.eventIndex);
        runtime.channel.emit('al_surface_mutation_event', event);
      }
      state.mounted = true;
      state.data = surfaceData;
      state.mountTime = timestamp;
      state.snapshotKey = lifecycleSnapshotKey;
    }

    return () => {
      const timestamp = runtime?.now() ?? Date.now();
      let cancelled = false;
      const run = () => {
        if (cancelled || !state.mounted || state.data !== surfaceData) return;
        if (trackMount && runtime?.active && runtime.publishMutations) {
          const mountIndex = runtime.mountIndexes.get(surfaceData);
          runtime.mountIndexes.delete(surfaceData);
          runtime.channel.emit('al_surface_mutation_event', {
            ...runtime.eventFactory.createEvent({
              eventTimestamp: timestamp,
              metadata: surfaceData.metadata,
              relatedEventIndex: mountIndex,
            }),
            event: 'unmount_component',
            surface: surfaceData.surfaceName,
            surfacePath: surfaceData.nonInteractiveSurface,
            surfaceData,
            mountedDuration:
              (timestamp - (state.mountTime ?? timestamp)) / 1000,
          });
        }
        unregisterSurfaceData(surfaceData);
        state.mounted = false;
        state.data = undefined;
        state.mountTime = undefined;
      };
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
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
  return Object.keys(metadata)
    .sort()
    .map((key) => {
      const value = metadata[key];
      const serializedValue =
        typeof value === 'number'
          ? Number.isNaN(value)
            ? 'number:NaN'
            : value === Number.POSITIVE_INFINITY
            ? 'number:Infinity'
            : value === Number.NEGATIVE_INFINITY
            ? 'number:-Infinity'
            : `number:${String(value)}`
          : `${typeof value}:${JSON.stringify(value)}`;
      return `${JSON.stringify(key)}:${serializedValue}`;
    })
    .join('|');
}

function serializeUIEventMetadata(metadata: UIEventMetadata): string {
  return `{${Object.keys(metadata)
    .sort()
    .map(
      (eventName) =>
        `${JSON.stringify(eventName)}:${serializeMetadata(metadata[eventName])}`
    )
    .join(',')}}`;
}

export function resetALSurfaceDataForTests(): void {
  surfaceRuntime = null;
  clearSurfaceData();
}
