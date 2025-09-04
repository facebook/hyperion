/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from 'hyperion-util/src/Types';
import type * as React from 'react';
import { ALFlowletDataType, IALFlowlet } from './ALFlowletManager';
import { SURFACE_WRAPPER_ATTRIBUTE_NAME } from './ALSurfaceConsts';
import * as ALSurfaceContext from './ALSurfaceContext';
import { ALSurfaceData } from './ALSurfaceData';
import * as SurfaceProxy from './ALSurfaceProxy';
import { ALMetadataEvent, ALSharedInitOptions } from './ALType';
import {
  SurfaceCapability,
  BaseSurfaceProps,
  BaseSurfaceInitOptions,
  SurfaceDataConstructorParams,
  initializeSurface,
  createSurfaceWithEventComponent,
  createSurfaceHOC,
  shouldTrackSurface,
  SurfacePlatform,
  SurfaceRenderer,
  SurfaceHOC,
  SurfaceRenderers,
  ChannelSurfaceEvent,
  SurfaceEventData,
  WebSurfaceEventExtension,
  createSurfaceDataRegistry,
} from './common/ALSurfaceUtils';

export type ALSurfaceEventData = SurfaceEventData<WebSurfaceEventExtension>;

export type ALSurfaceCapability = SurfaceCapability;

export type ALSurfaceProps = BaseSurfaceProps &
  Readonly<{
    nodeRef?: React.RefObject<HTMLElement | null | undefined>;
  }>;

export type ALSurfaceRenderer = SurfaceRenderer;
export type ALSurfaceHOC = SurfaceHOC<ALSurfaceProps>;
export type ALSurfaceRenderers = SurfaceRenderers<
  SurfaceComponent,
  ALSurfaceProps
>;
export type ALChannelSurfaceEvent = ChannelSurfaceEvent<ALSurfaceEventData>;
type ALChannelEventType = ALChannelSurfaceEvent;

export type SurfaceComponent = (
  props: React.PropsWithChildren<
    ALSurfaceProps & {
      renderer?: ALSurfaceRenderer;
      /** The optional incoming surface that we are re-wrapping via a proxy.
       * If this is provided,  then we won't emit mutations for this surface as we are
       * doubly wrapping that surface, for surface attribution purposes.
       */
      proxiedContext?: {
        mainContext: ALSurfaceContext.ALSurfaceContextFilledValue;
        container?: Element | DocumentFragment;
      };
    }
  >
) => React.ReactElement;

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelEventType> &
    ALSurfaceContext.InitOptions &
    SurfaceProxy.InitOptions &
    BaseSurfaceInitOptions & {
      enableReactDomPropsExtension?: boolean;
    }
>;

const alDataRegistry = createSurfaceDataRegistry<ALSurfaceData>();

export function init(options: InitOptions): ALSurfaceRenderers {
  const { flowletManager, channel } = options;
  const { ReactModule } = options.react;

  const SurfaceContext = ALSurfaceContext.init(options);

  function createALSurfaceEventData(props: {
    surface: string;
    surfaceData: ALSurfaceData;
    callFlowlet: IALFlowlet;
    triggerFlowlet: IALFlowlet<ALFlowletDataType> | undefined;
    metadata: ALMetadataEvent['metadata'];
    elementOrId: Element | string;
    isProxy: boolean;
    capability: SurfaceCapability | null | undefined;
  }): ALSurfaceEventData {
    return {
      surface: props.surface,
      surfaceData: props.surfaceData,
      callFlowlet: props.callFlowlet,
      triggerFlowlet: props.triggerFlowlet,
      metadata: props.metadata,
      element: props.elementOrId as Element,
      isProxy: props.isProxy,
      capability: props.capability,
    };
  }

  function getALSurfaceElements(surfaceData: ALSurfaceData): Set<Element> {
    return surfaceData.elements;
  }

  const SurfaceWithEvent = createSurfaceWithEventComponent<
    ALSurfaceData,
    ALSurfaceEventData
  >(
    'web' as SurfacePlatform,
    ReactModule,
    channel,
    createALSurfaceEventData,
    getALSurfaceElements
  );

  const Surface: SurfaceComponent = (props) => {
    const { surface, proxiedContext } = props;
    // if (__ext && __ext.flowlet !== flowlet) {
    //   __ext.flowlet = flowlet;
    // }

    const surfaceCtx = ALSurfaceContext.useALSurfaceContext();
    const {
      surface: parentSurface,
      nonInteractiveSurface: parentNonInteractiveSurface,
    } = surfaceCtx;

    let addSurfaceWrapper = props.nodeRef == null;
    let localRef = ReactModule.useRef<Element>();

    const metadata = props.metadata ?? {};
    const eventMetadata = props.uiEventMetadata;
    const capability =
      props.capability ?? proxiedContext?.mainContext.capability;

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
      (params: SurfaceDataConstructorParams) => {
        const alSurfaceData = new ALSurfaceData(
          params.surfaceName,
          params.surfacePath,
          params.surfaceContext,
          params.nonInteractiveSurfacePath,
          params.callFlowlet,
          params.capability,
          params.metadata,
          params.uiEventMetadata,
          params.attributeName,
          params.attributeValue
        );
        return alSurfaceData;
      }
    );

    const {
      surfacePath,
      nonInteractiveSurfacePath,
      attributeName,
      attributeValue,
      surfaceData,
      callFlowlet,
      isProxy,
    } = result;

    ReactModule.useLayoutEffect(() => {
      return () => {
        if (surfaceData && surfaceData.remove()) {
          alDataRegistry.delete(nonInteractiveSurfacePath);
          if (!capability?.nonInteractive) {
            alDataRegistry.delete(surfacePath);
          }
        }
      };
    }, [
      nonInteractiveSurfacePath,
      surfacePath,
      surfaceData,
      capability?.nonInteractive,
    ]);

    if (proxiedContext?.container instanceof Element) {
      const container = proxiedContext.container;
      if (
        container.childElementCount === 0 ||
        container.getAttribute(attributeName) === attributeValue
      ) {
        addSurfaceWrapper = false;
        container.setAttribute(attributeName, attributeValue);
        localRef.current = container;
      }
    }

    let children = props.renderer
      ? props.renderer(props.children)
      : props.children;

    const wrapperElementType =
      proxiedContext?.container instanceof SVGElement ? 'g' : 'span';

    children = createSurfaceWrapper(
      ReactModule,
      addSurfaceWrapper,
      wrapperElementType,
      attributeName,
      attributeValue,
      localRef,
      children
    );

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
          capability,
        },
        children
      );
    }

    return ReactModule.createElement(
      SurfaceContext.Provider,
      {
        value: surfaceData,
      },
      children
    );
  };

  SurfaceProxy.init({ ...options, surfaceComponent: Surface });

  const surfaceHOComponent = createSurfaceHOC(ReactModule, Surface);

  return {
    surfaceComponent: Surface,
    surfaceHOComponent,
  };
}

export function getALSurfaceData(
  nonInteractiveSurfacePath: string
): ALSurfaceData | undefined {
  return alDataRegistry.tryGet(nonInteractiveSurfacePath);
}

export function clearALSurfaceRegistry(): void {
  alDataRegistry.clear();
}

export function getAllALSurfaces(): Map<string, ALSurfaceData> {
  return alDataRegistry.getAll();
}

function createSurfaceWrapper(
  ReactModule: { createElement: typeof React.createElement },
  addSurfaceWrapper: boolean,
  wrapperElementType: string,
  attributeName: string,
  attributeValue: string,
  localRef: React.RefObject<any>,
  children: React.ReactNode
): React.ReactNode {
  if (!addSurfaceWrapper) {
    return children;
  }

  const wrapperProps: any = {
    [attributeName]: attributeValue,
    ref: localRef,
    [SURFACE_WRAPPER_ATTRIBUTE_NAME]: '1',
    style: { display: 'contents' },
  };

  return ReactModule.createElement(wrapperElementType, wrapperProps, children);
}
