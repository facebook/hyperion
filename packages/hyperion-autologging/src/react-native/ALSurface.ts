/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "hyperion-util/src/Types";
import type * as React from 'react';
import { ALFlowletDataType, IALFlowlet } from "../ALFlowletManager";
import * as ALSurfaceContext from "../ALSurfaceContext";
import { ALSurfaceData } from "../ALSurfaceData";
import { ALMetadataEvent, ALSharedInitOptions } from "../ALType";
import {
  SurfaceCapability,
  SurfaceEventData,
  SurfaceRenderer,
  SurfaceHOC,
  SurfaceRenderers,
  ChannelSurfaceEvent,
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
} from "../common/ALSurfaceUtils";

export type ALSurfaceEventData = SurfaceEventData<ReactNativeSurfaceEventExtension>;

export type ALSurfaceCapability = SurfaceCapability;

export type ALSurfaceProps = BaseSurfaceProps &
  Readonly<{
    // React Native compatible ref - no HTMLElement
    nodeRef?: React.RefObject<any>;
  }>;

export type ALSurfaceRenderer = SurfaceRenderer;
export type ALSurfaceHOC = SurfaceHOC<ALSurfaceProps>;
export type ALSurfaceRenderers = SurfaceRenderers<ALSurfaceComponent, ALSurfaceProps>;
export type ALChannelSurfaceEvent = ChannelSurfaceEvent<ALSurfaceEventData>;

type FlowletType = IALFlowlet;
type ALChannelEventType = ALChannelSurfaceEvent;

export type ALSurfaceComponent = (props: React.PropsWithChildren<
  ALSurfaceProps &
  {
    renderer?: ALSurfaceRenderer;
    proxiedContext?: {
      mainContext: ALSurfaceContext.ALSurfaceContextFilledValue,
      containerId?: string
    }
  }
>) => React.ReactElement;

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelEventType> &
  ALSurfaceContext.InitOptions &
  BaseSurfaceInitOptions
>;

class ALSurfaceDataRN extends ALSurfaceData {
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

const alDataRegistry = createSurfaceDataRegistry<ALSurfaceDataRN>();

export function init(options: InitOptions): ALSurfaceRenderers {
  const { flowletManager, channel } = options;
  const { ReactModule } = options.react;

  const SurfaceContext = ALSurfaceContext.init(options);

  function createALSurfaceEventData(props: {
    surface: string;
    surfaceData: ALSurfaceDataRN;
    callFlowlet: FlowletType;
    triggerFlowlet: IALFlowlet<ALFlowletDataType> | undefined;
    metadata: ALMetadataEvent['metadata'];
    elementOrId: Element | string;
    isProxy: boolean;
    capability: ALSurfaceCapability | null | undefined;
  }): ALSurfaceEventData {
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

  function getALSurfaceElements(surfaceData: ALSurfaceDataRN): Set<string> {
    // For React Native, we use componentIds which are strings
    return surfaceData.componentIds;
  }

  const SurfaceWithEvent = createSurfaceWithEventComponent<ALSurfaceDataRN, ALSurfaceEventData>(
    'react-native',
    ReactModule,
    channel,
    createALSurfaceEventData,
    getALSurfaceElements
  );

  const Surface: ALSurfaceComponent = props => {
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
      alDataRegistry,
      (params: SurfaceDataConstructorParams) => new ALSurfaceDataRN(params)
    );

    const { surfacePath, nonInteractiveSurfacePath, attributeName, attributeValue, surfaceData, callFlowlet, isProxy } = result;

    ReactModule.useLayoutEffect(() => {
      return () => {
        if (surfaceData && surfaceData.remove()) {
          alDataRegistry.delete(nonInteractiveSurfacePath);
          if (!capability?.nonInteractive) {
            alDataRegistry.delete(surfacePath);
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

  const surfaceHOComponent = createSurfaceHOC(ReactModule, Surface);

  return {
    surfaceComponent: Surface,
    surfaceHOComponent
  };
}

export function getALSurfaceData(nonInteractiveSurfacePath: string): ALSurfaceDataRN | undefined {
  return alDataRegistry.tryGet(nonInteractiveSurfacePath);
}

export function clearALSurfaceRegistry(): void {
  alDataRegistry.clear();
}

export function getAllALSurfaces(): Map<string, ALSurfaceDataRN> {
  return alDataRegistry.getAll();
}
