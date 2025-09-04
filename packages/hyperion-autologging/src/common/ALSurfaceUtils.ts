/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { AUTO_LOGGING_NON_INTERACTIVE_SURFACE, AUTO_LOGGING_SURFACE, SURFACE_SEPARATOR } from '../ALSurfaceConsts';
import type { IALFlowlet, ALFlowletDataType } from "../ALFlowletManager";
import type { ALMetadataEvent, ALFlowletEvent } from "../ALType";
import type { ALSurfaceEvent, EventMetadata } from "../ALSurfaceData";
import type * as React from 'react';
import type * as IReact from "hyperion-react/src/IReact";
import type * as IReactComponent from "hyperion-react/src/IReactComponent";
import { assert } from "hyperion-globals";

/**
 * Unified surface capability interface for both React Web and React Native
 */
export interface SurfaceCapability {
  /**
   * By default, in addition to reporting mount/unmount of a surface, all
   * interactions are also marked with a the name of their surface, unless
   * the following flag is set.
   */
  nonInteractive?: boolean;

  /**
   * In many cases, we only need to have a surface to mark various events UI
   * eith it. We may not need the mutation or visibility events for it.
   * if this options is explicitly set to false, we won't generate the mutation events.
   */
  trackMutation?: boolean;

  /**
   * When set, will track when the provided ratio [0,1] of the surface becomes visible
   */
  trackVisibilityThreshold?: number;
}

/**
 * Converts surface capability to string representation
 */
export function surfaceCapabilityToString(capability?: SurfaceCapability | null): string {
  if (!capability) {
    return '';
  }
  return JSON.stringify(capability);
}

export interface SurfacePathResult {
  surfacePath: string;
  nonInteractiveSurfacePath: string;
  attributeName: string;
  attributeValue: string;
}

export function calculateSurfacePaths(
  surface: string,
  parentSurface: string | null | undefined,
  parentNonInteractiveSurface: string | null | undefined,
  capability?: SurfaceCapability
): SurfacePathResult {
  const nonInteractiveSurfacePath = (parentNonInteractiveSurface ?? '') + SURFACE_SEPARATOR + surface;

  if (capability?.nonInteractive) {
    return {
      surfacePath: parentSurface ?? SURFACE_SEPARATOR,
      nonInteractiveSurfacePath,
      attributeName: AUTO_LOGGING_NON_INTERACTIVE_SURFACE,
      attributeValue: nonInteractiveSurfacePath,
    };
  } else {
    const surfacePath = (parentSurface ?? '') + SURFACE_SEPARATOR + surface;
    return {
      surfacePath,
      nonInteractiveSurfacePath,
      attributeName: AUTO_LOGGING_SURFACE,
      attributeValue: surfacePath,
    };
  }
}

export function createSurfaceMetadata(
  callFlowlet: IALFlowlet,
  capability?: SurfaceCapability,
  baseMetadata?: ALMetadataEvent['metadata']
): ALMetadataEvent['metadata'] {
  const metadata = baseMetadata ?? {};
  metadata.original_call_flowlet = callFlowlet.getFullName();
  metadata.surface_capability = surfaceCapabilityToString(capability);
  return metadata;
}

export type SurfacePlatform = 'web' | 'react-native';

/**
 * Generic base interface for surface event data
 * To be extended by platform-specific implementations
 */
export interface BaseSurfaceEventData {
  surface: string;
  callFlowlet: IALFlowlet;
  triggerFlowlet: IALFlowlet<ALFlowletDataType> | undefined;
  metadata: ALMetadataEvent['metadata'];
  isProxy: boolean;
  capability: SurfaceCapability | null | undefined;
}

export interface ReactNativeSurfaceEventExtension {
  elementId: string;
}

export interface WebSurfaceEventExtension {
  element: Element;
}

/**
 * Generic base interface for surface props
 * To be extended by platform-specific implementations
 */
export interface BaseSurfaceProps {
  surface: string;
  metadata?: ALMetadataEvent['metadata'];
  uiEventMetadata?: EventMetadata;
  capability?: SurfaceCapability;
}

export interface BaseChannelSurfaceEvent<TEventData> {
  al_surface_mount: [TEventData];
  al_surface_unmount: [TEventData];
}

export type SurfaceEventData<TPlatformExtension> =
  BaseSurfaceEventData &
  ALMetadataEvent &
  ALFlowletEvent &
  ALSurfaceEvent &
  TPlatformExtension &
  Readonly<{
    isProxy: boolean;
  }>;

export type SurfaceRenderer = (node: React.ReactNode) => React.ReactElement;

export type SurfaceHOC<TProps> = (props: TProps, renderer?: SurfaceRenderer) => SurfaceRenderer;

export interface SurfaceRenderers<TSurfaceComponent, TProps> {
  surfaceComponent: TSurfaceComponent;
  surfaceHOComponent: (props: TProps, renderer?: SurfaceRenderer) => SurfaceRenderer;
}

export type ChannelSurfaceEvent<TEventData> = Readonly<BaseChannelSurfaceEvent<TEventData>>;

/**
 * Common base initialization options shared between platforms
 */
export interface BaseSurfaceInitOptions {
  react: IReactComponent.InitOptions & {
    ReactModule: {
      createElement: typeof React.createElement;
      useLayoutEffect: typeof React.useLayoutEffect;
      useRef: typeof React.useRef;
    };
    IReactModule: IReact.IReactModuleExports;
    IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports;
  };
  enableReactPropsExtension?: boolean;
}

export function createSurfaceDataRegistry<T>(): SurfaceDataRegistry<T> {
  const registry = new Map<string, T>();

  const dataRegistry: SurfaceDataRegistry<T> = {
    tryGet: (nonInteractiveSurfacePath: string) => registry.get(nonInteractiveSurfacePath),
    set: (nonInteractiveSurfacePath: string, data: T) => {
      registry.set(nonInteractiveSurfacePath, data);
    },
    delete: (nonInteractiveSurfacePath: string) => registry.delete(nonInteractiveSurfacePath),
    clear: () => registry.clear(),
    getAll: () => new Map(registry)
  };

  return dataRegistry;
}


/**
 * Platform-aware function to handle surface element/component registration
 * For web: adds DOM element, for RN: generates component ID
 */
export function registerSurfaceElement(
  platform: SurfacePlatform,
  elements: Set<Element> | Set<string>,
  nodeRef: React.RefObject<any>
): string | Element | null {
  if (platform === 'web') {
    const element = nodeRef.current as Element;
    if (element) {
      (elements as Set<Element>).add(element);
      return element;
    }
    return null;
  } else {
    // React Native - generate component ID
    const componentId = `rn_surface_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    (elements as Set<string>).add(componentId);
    return componentId;
  }
}

/**
 * Platform-aware function to unregister surface element/component
 */
export function unregisterSurfaceElement(
  platform: SurfacePlatform,
  elements: Set<Element> | Set<string>,
  elementOrId: Element | string
): void {
  if (platform === 'web') {
    (elements as Set<Element>).delete(elementOrId as Element);
  } else {
    (elements as Set<string>).delete(elementOrId as string);
  }
}

/**
 * Platform-aware function to set surface attributes
 */
export function setSurfaceAttribute(
  platform: SurfacePlatform,
  elementOrId: Element | string | null,
  attributeName: string,
  attributeValue: string
): void {
  if (platform === 'web' && elementOrId instanceof Element) {
    elementOrId.setAttribute(attributeName, attributeValue);
  }
  // For React Native, attributes are handled differently (via component IDs)
  // so we don't need to do anything here
}

/**
 * Generic function to create platform-specific surface effect
 */
export function createSurfaceEffect<TElement>(
  platform: SurfacePlatform,
  useLayoutEffect: (effect: () => void | (() => void), deps: any[]) => void,
  props: {
    nodeRef: React.RefObject<TElement>;
    attributeName: string;
    attributeValue: string;
    capability: SurfaceCapability | null | undefined;
    onMount: (elementOrId: Element | string) => void;
    onUnmount: (elementOrId: Element | string) => void;
    elements: Set<Element> | Set<string>;
  }
): void {
  const { nodeRef, attributeName, attributeValue, capability, onMount, onUnmount, elements } = props;

  useLayoutEffect(() => {
    const elementOrId = registerSurfaceElement(platform, elements, nodeRef);

    if (elementOrId == null) {
      return;
    }

    setSurfaceAttribute(platform, elementOrId, attributeName, attributeValue);

    if (capability?.trackMutation === false) {
      return () => {
        unregisterSurfaceElement(platform, elements, elementOrId);
      };
    }

    onMount(elementOrId);

    return () => {
      onUnmount(elementOrId);
      unregisterSurfaceElement(platform, elements, elementOrId);
    };
  }, [attributeName, attributeValue]);
}

/**
 * Generic interface for surface data registry operations
 */
export interface SurfaceDataRegistry<T> {
  tryGet: (nonInteractiveSurfacePath: string) => T | undefined;
  set: (nonInteractiveSurfacePath: string, data: T) => void;
  delete: (nonInteractiveSurfacePath: string) => boolean;
  clear: () => void;
  getAll: () => Map<string, T>;
}


export interface SurfaceDataConstructorParams {
  surfaceName: string;
  surfacePath: string;
  surfaceContext: any; // Keeping generic for platform compatibility
  nonInteractiveSurfacePath: string;
  callFlowlet: IALFlowlet;
  capability: SurfaceCapability | null | undefined;
  metadata: ALMetadataEvent['metadata'];
  uiEventMetadata: EventMetadata | null | undefined;
  attributeName: string;
  attributeValue: string;
}

export function initializeSurface<TSurfaceData extends {
  callFlowlet: IALFlowlet;
  metadata: ALMetadataEvent['metadata'];
  setUIEventMetadata: (metadata: EventMetadata | null | undefined) => void;
}>(
  surface: string,
  parentSurface: string | null | undefined,
  parentNonInteractiveSurface: string | null | undefined,
  capability: SurfaceCapability | null | undefined,
  metadata: ALMetadataEvent['metadata'],
  eventMetadata: EventMetadata | null | undefined,
  proxiedContext: any | undefined,
  surfaceCtx: any,
  flowletManager: any,
  surfaceDataRegistry: SurfaceDataRegistry<TSurfaceData>,
  createSurfaceData: (params: SurfaceDataConstructorParams) => TSurfaceData
): {
  surfacePath: string;
  nonInteractiveSurfacePath: string;
  attributeName: string;
  attributeValue: string;
  surfaceData: TSurfaceData;
  callFlowlet: IALFlowlet;
  isProxy: boolean;
} {
  let surfacePath: string;
  let nonInteractiveSurfacePath: string;
  let attributeName: string;
  let attributeValue: string;

  const isProxy = proxiedContext != null;
  const effectiveCapability = capability ?? proxiedContext?.mainContext?.capability;

  if (!proxiedContext) {
    const pathResult = calculateSurfacePaths(surface, parentSurface, parentNonInteractiveSurface, effectiveCapability ?? undefined);
    surfacePath = pathResult.surfacePath;
    nonInteractiveSurfacePath = pathResult.nonInteractiveSurfacePath;
    attributeName = pathResult.attributeName;
    attributeValue = pathResult.attributeValue;
  } else {
    surfacePath = proxiedContext.mainContext.surface;
    nonInteractiveSurfacePath = proxiedContext.mainContext.nonInteractiveSurface;
    attributeName = AUTO_LOGGING_SURFACE;
    attributeValue = surfacePath;
  }

  let surfaceData = surfaceDataRegistry.tryGet(nonInteractiveSurfacePath);
  let callFlowlet: IALFlowlet;

  if (!surfaceData) {
    assert(!proxiedContext, "Proxied surface should always have surface data already");

    callFlowlet = new flowletManager.flowletCtor(surface, surfaceCtx.callFlowlet ?? flowletManager.root);
    callFlowlet.data.surface = nonInteractiveSurfacePath;

    surfaceData = createSurfaceData({
      surfaceName: surface,
      surfacePath,
      surfaceContext: surfaceCtx,
      nonInteractiveSurfacePath,
      callFlowlet,
      capability: effectiveCapability,
      metadata,
      uiEventMetadata: eventMetadata,
      attributeName,
      attributeValue,
    });

    surfaceDataRegistry.set(nonInteractiveSurfacePath, surfaceData);
  } else {
    callFlowlet = surfaceData.callFlowlet;
  }

  createSurfaceMetadata(callFlowlet, effectiveCapability ?? undefined, metadata);
  surfaceData.metadata = metadata;
  surfaceData.setUIEventMetadata(eventMetadata);

  return {
    surfacePath,
    nonInteractiveSurfacePath,
    attributeName,
    attributeValue,
    surfaceData,
    callFlowlet,
    isProxy,
  };
}

export function createSurfaceWithEventComponent<
  TSurfaceData,
  TEventData
>(
  platform: SurfacePlatform,
  ReactModule: {
    createElement: typeof React.createElement;
    useLayoutEffect: typeof React.useLayoutEffect;
  },
  channel: any, // Keep flexible for compatibility with different channel implementations
  createEventData: (props: {
    surface: string;
    surfaceData: TSurfaceData;
    callFlowlet: IALFlowlet;
    triggerFlowlet: IALFlowlet<ALFlowletDataType> | undefined;
    metadata: ALMetadataEvent['metadata'];
    elementOrId: Element | string;
    isProxy: boolean;
    capability: SurfaceCapability | null | undefined;
  }) => TEventData,
  getElements: (surfaceData: TSurfaceData) => Set<Element> | Set<string>
): React.ComponentType<{
  nodeRef: React.RefObject<any>;
  attributeName: string;
  attributeValue: string;
  surfaceData: TSurfaceData;
  callFlowlet: IALFlowlet;
  triggerFlowlet: IALFlowlet<ALFlowletDataType> | undefined;
  metadata: ALMetadataEvent['metadata'];
  isProxy: boolean;
  capability: SurfaceCapability | null | undefined;
  children?: React.ReactNode;
}> {
  return function SurfaceWithEvent(props) {
    const {
      surfaceData,
      nodeRef,
      attributeName,
      attributeValue,
      capability,
      callFlowlet,
      triggerFlowlet,
      metadata,
      isProxy
    } = props;

    const elements = getElements(surfaceData);

    createSurfaceEffect(platform, ReactModule.useLayoutEffect, {
      nodeRef,
      attributeName,
      attributeValue,
      capability,
      elements,
      onMount: (elementOrId: Element | string) => {
        const event = createEventData({
          surface: attributeValue,
          surfaceData,
          callFlowlet,
          triggerFlowlet,
          metadata,
          elementOrId,
          isProxy,
          capability
        });
        channel.emit('al_surface_mount', event);
      },
      onUnmount: (elementOrId: Element | string) => {
        const event = createEventData({
          surface: attributeValue,
          surfaceData,
          callFlowlet,
          triggerFlowlet: callFlowlet.data.triggerFlowlet,
          metadata,
          elementOrId,
          isProxy,
          capability
        });
        channel.emit('al_surface_unmount', event);
      }
    });

    return props.children as React.ReactElement;
  };
}

export function createSurfaceHOC<TProps>(
  ReactModule: { createElement: typeof React.createElement },
  SurfaceComponent: React.ComponentType<any>
): (props: TProps, renderer?: SurfaceRenderer) => SurfaceRenderer {
  return (props, renderer) => {
    return children => {
      return ReactModule.createElement(
        SurfaceComponent as any,
        props as React.Attributes,
        renderer ? renderer(children) : children
      );
    };
  };
}


export function shouldTrackSurface(capability: SurfaceCapability | null | undefined): boolean {
  return (
    !capability || // all default capabilities enabled
    capability.trackMutation !== false || // need mutation event
    capability.trackVisibilityThreshold !== undefined // needs visibility event
  );
}

export function createSurfaceContextValue(surfaceData: any): {
  surface: string;
  nonInteractiveSurface: string;
  callFlowlet: IALFlowlet;
  capability: SurfaceCapability | null | undefined;
} {
  return {
    surface: surfaceData.surface,
    nonInteractiveSurface: surfaceData.nonInteractiveSurface,
    callFlowlet: surfaceData.callFlowlet,
    capability: surfaceData.capability
  };
}
