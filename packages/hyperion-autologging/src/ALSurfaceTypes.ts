/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ALSurfaceData } from "./ALSurfaceData";
import { ALFlowletEvent, ALMetadataEvent, Metadata } from "./ALType";
import * as ALSurfaceContext from "./ALSurfaceContext";

export type ALSurfaceProps = Readonly<{
  surface: string;
  metadata?: ALMetadataEvent['metadata'];
  uiEventMetadata?: EventMetadata,
  capability?: ALSurfaceCapability,
  nodeRef?: React.RefObject<HTMLElement | null | undefined>,
}>;

export type SurfaceComponent = (props: React.PropsWithChildren<
  ALSurfaceProps &
  {
    renderer?: ALSurfaceRenderer;
    // callFlowlet: FlowletType;
    /** The optional incoming surface that we are re-wrapping via a proxy.
     * If this is provided,  then we won't emit mutations for this surface as we are
     * doubly wrapping that surface, for surface attribution purposes.
     */
    proxiedContext?: {
      mainContext: ALSurfaceContext.ALSurfaceContextFilledValue,
      container?: Element | DocumentFragment
    }
  }
>) => React.ReactElement;

export type ALSurfaceRenderer = (node: React.ReactNode) => React.ReactElement;
export type ALSurfaceHOC = (props: ALSurfaceProps, renderer?: ALSurfaceRenderer) => ALSurfaceRenderer;
export type ALSurfaceRenderers = {
  surfaceComponent: SurfaceComponent;
  surfaceHOComponent: (props: ALSurfaceProps, renderer?: ALSurfaceRenderer) => ALSurfaceRenderer;
};


export type ALChannelSurfaceEvent = Readonly<{
  al_surface_mount: [ALSurfaceEventData];
  al_surface_unmount: [ALSurfaceEventData];
}>;

export interface ALSurfaceCapability {
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
  /**
   * Optional style to apply to the surface wrapper
   */
  wrapperStyle?: React.CSSProperties;
}

export type ALSurfaceEvent = Readonly<{
    surface: string;
    surfaceData: ALSurfaceData;
  }>;


export type ALSurfaceEventData =
  ALMetadataEvent &
  ALFlowletEvent &
  ALSurfaceEvent &
  Readonly<{
    element: Element;
    isProxy: boolean;
    capability: ALSurfaceCapability | null | undefined;
  }>;

export type WritableEventMetadata = {
  [eventName in keyof DocumentEventMap]?: Metadata
};

export type EventMetadata = Readonly<WritableEventMetadata>;
