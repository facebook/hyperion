/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "hyperion-util/src/Types";
import type * as React from 'react';
import { ALFlowletDataType, IALFlowlet } from "./ALFlowletManager";
import * as ALSurfaceContext from "./ALSurfaceContext";
import { ALSurfaceData } from "./ALSurfaceData";
import { ALMetadataEvent, ALSharedInitOptions } from "./ALType";
import {
  SurfaceCapability,
  GenericSurfaceEventData,
  GenericSurfaceRenderer,
  GenericSurfaceHOC,
  GenericSurfaceRenderers,
  GenericChannelSurfaceEvent,
  ReactNativeSurfaceEventExtension,
  BaseSurfaceInitOptions,
  SurfaceDataConstructorParams,
  initializeSurface,
  createSurfaceWithEventComponent,
  createSurfaceHOC,
  shouldTrackSurface,
  createSurfaceContextValue,
  createSurfaceDataRegistry,
  BaseSurfaceProps
} from "./common/SurfaceUtils";

export type RNSurfaceEventData = GenericSurfaceEventData<ReactNativeSurfaceEventExtension>;

export type RNSurfaceCapability = SurfaceCapability;

export type RNSurfaceProps = BaseSurfaceProps &
  Readonly<{
    // React Native compatible ref - no HTMLElement
    nodeRef?: React.RefObject<any>;
  }>;

export type RNSurfaceRenderer = GenericSurfaceRenderer;
export type RNSurfaceHOC = GenericSurfaceHOC<RNSurfaceProps>;
export type RNSurfaceRenderers = GenericSurfaceRenderers<RNSurfaceComponent, RNSurfaceProps>;
export type RNChannelSurfaceEvent = GenericChannelSurfaceEvent<RNSurfaceEventData>;

type FlowletType = IALFlowlet;
type RNChannelEventType = RNChannelSurfaceEvent;

export type RNSurfaceComponent = (props: React.PropsWithChildren<
  RNSurfaceProps &
  {
    renderer?: RNSurfaceRenderer;
    /** The optional incoming surface that we are re-wrapping via a proxy.
     * If this is provided, then we won't emit mutations for this surface as we are
     * doubly wrapping that surface, for surface attribution purposes.
     */
    proxiedContext?: {
      mainContext: ALSurfaceContext.ALSurfaceContextFilledValue,
      // No DOM container concept in React Native
      containerId?: string
    }
  }
>) => React.ReactElement;

export type RNInitOptions = Types.Options<
  ALSharedInitOptions<RNChannelEventType> &
  ALSurfaceContext.InitOptions &
  BaseSurfaceInitOptions
>;

class RNSurfaceData extends ALSurfaceData {
  // React Native uses component IDs instead of DOM elements
  public componentIds = new Set<string>();

  constructor(params: SurfaceDataConstructorParams) {
    let parentSurface: ALSurfaceData | any = ALSurfaceData.root;

    if (params.surfaceContext?.nonInteractiveSurface) {
      const parentData = ALSurfaceData.tryGet(params.surfaceContext.nonInteractiveSurface);
      if (parentData) {
        parentSurface = parentData;
      }
    }

    super(
      params.surfaceName,
      params.surfacePath,
      parentSurface,
      params.nonInteractiveSurfacePath,
      params.callFlowlet,
      params.capability,
      params.metadata,
      params.uiEventMetadata,
      params.attributeName,
      params.attributeValue
    );
  }

  addComponentId(componentId: string) {
    this.componentIds.add(componentId);
    // Cast elements to any since we know it will be used for string IDs in RN
    (this.elements as any).add(componentId);
  }

  removeComponentId(componentId: string) {
    this.componentIds.delete(componentId);
    (this.elements as any).delete(componentId);
  }

  get surfacePath(): string {
    return this.surface;
  }

  get nonInteractiveSurfacePath(): string {
    return this.nonInteractiveSurface;
  }

  get surface_capability(): string {
    if (!this.capability) {
      return JSON.stringify({
        trackMutation: true,
        nonInteractive: false
      });
    }
    return JSON.stringify(this.capability);
  }
}

// Use common registry factory
const { registry: rnSurfaceDataRegistry, dataRegistry: rnDataRegistry } = createSurfaceDataRegistry<RNSurfaceData>();

export function init(options: RNInitOptions): RNSurfaceRenderers {
  const { flowletManager, channel } = options;
  const { ReactModule } = options.react;

  const SurfaceContext = ALSurfaceContext.init(options);

  function createRNSurfaceEventData(props: {
    surface: string;
    surfaceData: RNSurfaceData;
    callFlowlet: FlowletType;
    triggerFlowlet: IALFlowlet<ALFlowletDataType> | undefined;
    metadata: ALMetadataEvent['metadata'];
    elementOrId: Element | string;
    isProxy: boolean;
    capability: RNSurfaceCapability | null | undefined;
  }): RNSurfaceEventData {
    return {
      surface: props.surface,
      surfaceData: props.surfaceData as any,
      callFlowlet: props.callFlowlet,
      triggerFlowlet: props.triggerFlowlet,
      metadata: props.metadata,
      elementId: props.elementOrId as string,
      isProxy: props.isProxy,
      capability: props.capability
    };
  }

  function getRNSurfaceElements(surfaceData: RNSurfaceData): Set<string> {
    // For React Native, we use componentIds which are strings
    return surfaceData.componentIds;
  }

  const SurfaceWithEvent = createSurfaceWithEventComponent<RNSurfaceData, RNSurfaceEventData>(
    'react-native',
    ReactModule,
    channel,
    createRNSurfaceEventData,
    getRNSurfaceElements
  );

  const RNSurface: RNSurfaceComponent = props => {
    const { surface, proxiedContext } = props;
    const surfaceCtx = ALSurfaceContext.useALSurfaceContext();
    const { surface: parentSurface, nonInteractiveSurface: parentNonInteractiveSurface } = surfaceCtx;

    let localRef = ReactModule.useRef<any>();

    const metadata = props.metadata ?? {};
    const eventMetadata = props.uiEventMetadata;
    const capability = props.capability ?? proxiedContext?.mainContext.capability;

    if (proxiedContext?.containerId) {
      localRef.current = proxiedContext.containerId;
    }

    const result = initializeSurface(
      surface,
      parentSurface,
      parentNonInteractiveSurface,
      capability,
      metadata,
      eventMetadata,
      proxiedContext,
      surfaceCtx,
      flowletManager,
      rnDataRegistry,
      (params: SurfaceDataConstructorParams) => new RNSurfaceData(params)
    );

    const { surfacePath, nonInteractiveSurfacePath, attributeName, attributeValue, surfaceData, callFlowlet, isProxy } = result;

    ReactModule.useLayoutEffect(() => {
      return () => {
        if (surfaceData && surfaceData.remove()) {
          rnDataRegistry.delete(nonInteractiveSurfacePath);
          if (!capability?.nonInteractive) {
            rnDataRegistry.delete(surfacePath);
          }
        }
      };
    }, [nonInteractiveSurfacePath, surfacePath, surfaceData, capability?.nonInteractive]);

    let children = props.renderer ? props.renderer(props.children) : props.children;

    // For React Native, we don't have a proper wrapper element type, so we skip the wrapper
    // The surface tracking functionality still works through context and effects

    if (shouldTrackSurface(capability)) {
      const triggerFlowlet = callFlowlet.data.triggerFlowlet;
      const nodeRef = props.nodeRef ?? localRef;

      children = ReactModule.createElement(
        SurfaceWithEvent,
        {
          nodeRef,
          attributeName,
          attributeValue,
          surfaceData,
          callFlowlet,
          triggerFlowlet,
          metadata,
          isProxy,
          capability
        },
        children
      );
    }

    const contextValue = createSurfaceContextValue(surfaceData);

    return ReactModule.createElement(
      SurfaceContext.Provider,
      {
        value: contextValue as any // Type compatibility with ALSurfaceContext
      },
      children
    );
  };

  const surfaceHOComponent = createSurfaceHOC(ReactModule, RNSurface);

  return {
    surfaceComponent: RNSurface,
    surfaceHOComponent
  };
}

export function getRNSurfaceData(nonInteractiveSurfacePath: string): RNSurfaceData | undefined {
  return rnSurfaceDataRegistry.get(nonInteractiveSurfacePath);
}

export function clearRNSurfaceRegistry(): void {
  rnSurfaceDataRegistry.clear();
}

export function getAllRNSurfaces(): Map<string, RNSurfaceData> {
  return new Map(rnSurfaceDataRegistry);
}
