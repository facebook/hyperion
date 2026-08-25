/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type {
  ALLoggableEvent,
  ALMetadata,
  ALMetadataValue,
} from './ALCommonTypes';
import type {
  ALSurfaceHierarchyChild,
  ALSurfaceHierarchyNodeContract,
} from './ALSurfaceHierarchy';

export interface ALSurfaceDataNodeContract<
  ElementType = never,
  MetadataType = ALMetadata,
  UIEventName extends PropertyKey = string
> extends ALSurfaceHierarchyChild {
  readonly surface: string;
  readonly nonInteractiveSurface: string;
  readonly parent: ALSurfaceHierarchyNodeContract<
    ALSurfaceDataNodeContract<ElementType, MetadataType, UIEventName>
  >;
  readonly metadata: MetadataType;
  getChild(
    surfaceName: string
  ): ALSurfaceDataNodeContract<ElementType, MetadataType, UIEventName> | null;
  getChildren(): ALSurfaceDataNodeContract<
    ElementType,
    MetadataType,
    UIEventName
  >[];
  getElements(lookupIfEmpty?: boolean): readonly ElementType[];
  getInheritedPropery<T>(propName: string): T | undefined | null;
  setInheritedPropery<T>(propName: string, propValue: T): T;
  getInheriteUIEventMetadata(eventName: UIEventName): MetadataType | undefined;
}

export interface ALSurfaceDataRegistry<
  Node extends ALSurfaceHierarchyChild,
  Root extends ALSurfaceHierarchyNodeContract<Node>
> {
  readonly root: Root;
  tryGet(surface: string): Node | null | undefined;
  get(surface: string): Node;
}

export interface ALSurfaceMutationEventBase<
  SurfaceData,
  ElementType = never,
  MetadataValue = ALMetadataValue
> extends ALLoggableEvent<MetadataValue> {
  readonly event: 'mount_component' | 'unmount_component';
  readonly surface: string;
  readonly surfaceData: SurfaceData;
  readonly element?: ElementType;
}

export type ALSurfaceMutationEventWithElement<
  SurfaceData,
  ElementType,
  MetadataValue = ALMetadataValue
> = Omit<
  ALSurfaceMutationEventBase<SurfaceData, ElementType, MetadataValue>,
  'element'
> &
  Readonly<{
    element: ElementType;
  }>;
