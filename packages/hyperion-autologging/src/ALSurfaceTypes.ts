/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as ALSurfaceContext from "./ALSurfaceContext";
import { ALMetadataEvent, Metadata } from "./ALType";

export type ALSurfaceProps = Readonly<{
  surface: string;
  metadata?: ALMetadataEvent['metadata'];
  uiEventMetadata?: EventMetadata,
  capability?: ALSurfaceCapability,
  nodeRef?: React.RefObject<Element | null | undefined> | null,
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

export type WritableEventMetadata = {
  [eventName in keyof DocumentEventMap]?: Metadata
};

export type EventMetadata = Readonly<WritableEventMetadata>;
