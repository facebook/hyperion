/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "hyperion-globals";
import * as IReact from "hyperion-react/src/IReact";
import * as IReactComponent from "hyperion-react/src/IReactComponent";
import * as Types from "hyperion-util/src/Types";
import type * as React from 'react';
import { ALFlowletDataType, IALFlowlet } from "./ALFlowletManager";
import { AUTO_LOGGING_NON_INTERACTIVE_SURFACE, AUTO_LOGGING_SURFACE, SURFACE_SEPARATOR, SURFACE_WRAPPER_ATTRIBUTE_NAME } from './ALSurfaceConsts';
import * as ALSurfaceContext from "./ALSurfaceContext";
import { ALSurfaceData } from "./ALSurfaceData";
import * as SurfaceProxy from "./ALSurfaceProxy";
import { ALMetadataEvent, ALSharedInitOptions } from "./ALType";
import { ALChannelSurfaceEvent, ALSurfaceCapability, ALSurfaceEventData, ALSurfaceRenderers, SurfaceComponent } from "./ALSurfaceTypes";


function surfaceCapabilityToString(capability?: ALSurfaceCapability | null): string {
  if (!capability) {
    return '';
  }
  return JSON.stringify(capability);
}


type FlowletType = IALFlowlet;
type ALChannelEventType = ALChannelSurfaceEvent;



export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelEventType> &
  // IReactFlowlet.InitOptions<ALFlowletDataType, FlowletType, FlowletManagerType> &
  // ALIReactFlowlet.InitOptions &
  ALSurfaceContext.InitOptions &
  SurfaceProxy.InitOptions &
  {
    react: IReactComponent.InitOptions & {
      ReactModule: {
        createElement: typeof React.createElement;
        useLayoutEffect: typeof React.useLayoutEffect;
        useRef: typeof React.useRef;
      };
      IReactModule: IReact.IReactModuleExports;
      IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports;
    };
    domCallFlowletAttributeName?: string;
    enableReactDomPropsExtension?: boolean;
  }
>;

export function init(options: InitOptions): ALSurfaceRenderers {
  const { flowletManager, channel } = options;
  const { ReactModule } = options.react;

  const SurfaceContext = ALSurfaceContext.init(options);

  function SurfaceWithEvent(props: React.PropsWithChildren<{
    nodeRef: React.RefObject<HTMLElement | null | undefined> | React.MutableRefObject<Element | undefined>;
    domAttributeName: string;
    domAttributeValue: string;
    surfaceData: ALSurfaceData;
    callFlowlet: FlowletType;
    triggerFlowlet: IALFlowlet<ALFlowletDataType> | undefined;
    metadata: ALMetadataEvent['metadata'];
    isProxy: boolean;
    capability: ALSurfaceCapability | null | undefined;

  }>): React.ReactNode {
    const { surfaceData, nodeRef, domAttributeName, domAttributeValue, capability, callFlowlet, triggerFlowlet, metadata, isProxy } = props;

    ReactModule.useLayoutEffect(() => {
      const surface = surfaceData.surfaceName;

      __DEV__ && assert(nodeRef != null, "Invalid surface effect without a ref: " + surface);
      const element = nodeRef.current;
      if (element == null) {
        return;
      }
      element.setAttribute(domAttributeName, domAttributeValue);
      __DEV__ && assert(element != null, "Invalid surface effect without an element: " + surface);

      /**
       * Although the following check may seem logical, but it seems that react may first run the component body code
       * then run unmount of the previous components. So, at this point, we may indeed have a previous instance of the
       * surface still not unmounted (specially in DEV mode that react runs everything twice)
       * So, commenting code and keeping it for future references.
       */
      // __DEV__ && assert(
      //   !surfaceData.getMutationEvent() && !surfaceData.getVisibilityEvent(),
      //   `Invalid surface setup for ${surfaceData.surface}. Didn't expect mutation and visibility events`
      // )

      surfaceData.addElement(element);

      if (capability?.trackMutation === false) {
        return () => {
          surfaceData.removeElement(element);
        };
      }

      const event: ALSurfaceEventData = {
        surface: domAttributeValue,
        surfaceData,
        callFlowlet,
        triggerFlowlet,
        metadata,
        element,
        isProxy,
        capability
      };

      channel.emit('al_surface_mount', event);
      return () => {
        /**
         * The trigger on the surface or its parent might be updated
         * so, we should re-read that value again.
         */
        channel.emit('al_surface_unmount', {
          ...event,
          triggerFlowlet: callFlowlet.data.triggerFlowlet
        });
        surfaceData.removeElement(element);
      }
    }, [domAttributeName, domAttributeValue, nodeRef]);

    return props.children
  }

  const Surface: SurfaceComponent = props => {
    const { surface, proxiedContext } = props;
    // if (__ext && __ext.flowlet !== flowlet) {
    //   __ext.flowlet = flowlet;
    // }

    let surfacePath: string;
    let nonInteractiveSurfacePath: string;
    let domAttributeName: string;
    let domAttributeValue: string;

    const surfaceCtx = ALSurfaceContext.useALSurfaceContext();
    const { surface: parentSurface, nonInteractiveSurface: parentNonInteractiveSurface } = surfaceCtx;

    let addSurfaceWrapper = props.nodeRef == null;
    let localRef = ReactModule.useRef<Element>();

    // empty .capability field is default, means all enabled!
    const capability = props.capability ?? proxiedContext?.mainContext.capability;

    if (!proxiedContext) {
      nonInteractiveSurfacePath = (parentNonInteractiveSurface ?? '') + SURFACE_SEPARATOR + surface;
      if (capability?.nonInteractive) {
        surfacePath = parentSurface ?? SURFACE_SEPARATOR;
        domAttributeName = AUTO_LOGGING_NON_INTERACTIVE_SURFACE;
        domAttributeValue = nonInteractiveSurfacePath;
      } else {
        surfacePath = (parentSurface ?? '') + SURFACE_SEPARATOR + surface;
        domAttributeName = AUTO_LOGGING_SURFACE;
        domAttributeValue = surfacePath;
      }
    } else {
      surfacePath = proxiedContext.mainContext.surface;
      nonInteractiveSurfacePath = proxiedContext.mainContext.nonInteractiveSurface;
      domAttributeName = AUTO_LOGGING_SURFACE
      domAttributeValue = surfacePath;
      if (proxiedContext.container instanceof Element) {
        const container = proxiedContext.container;
        if (container.childElementCount === 0 || container.getAttribute(domAttributeName) === domAttributeValue) {
          addSurfaceWrapper = false;
          container.setAttribute(domAttributeName, domAttributeValue);
          localRef.current = container;
        }
      }
    }

    // Emit surface mutation events on mount/unmount
    const metadata = props.metadata ?? {}; // Note that we want the same object to be shared between events to share the changes.
    const eventMetadata = props.uiEventMetadata;

    // Let's see if the parent node (context) already has this surface
    let surfaceData =  surfaceCtx.getChild(surface);

    let callFlowlet: FlowletType;
    if (!surfaceData) {
      assert(!proxiedContext, "Proxied surface should always have surface data already");

      /**
       * In case surfaces are unmounted, we want them all to have one common
       * ancestor so that we can assign triggerFlowlet to it and have them all
       * pick it up. This is specially useful to link event to unmount
       */
      callFlowlet = new flowletManager.flowletCtor(surface, surfaceCtx.callFlowlet ?? flowletManager.root);
      callFlowlet.data.surface = nonInteractiveSurfacePath;
      surfaceData = new ALSurfaceData(
        surface,
        surfacePath,
        surfaceCtx,
        nonInteractiveSurfacePath,
        callFlowlet,
        capability,
        metadata,
        eventMetadata,
        domAttributeName,
        domAttributeValue,
      );
    } else {
      callFlowlet = surfaceData.callFlowlet;
    }

    const isProxy = proxiedContext != null;

    metadata.original_call_flowlet = callFlowlet.getFullName();
    metadata.surface_capability = surfaceCapabilityToString(capability);
    // Update the metadata on every render to ensure it stays current
    surfaceData.metadata = metadata;
    surfaceData.setUIEventMetadata(eventMetadata);

    // callFlowlet.data.surface = surfacePath;
    let children = props.renderer ? props.renderer(props.children) : props.children;

    const wrapperElementType = proxiedContext?.container instanceof SVGElement ? "g" : "span";

    if (addSurfaceWrapper) {
      const style = props?.capability?.wrapperStyle ?? {display: "contents"};
      children = ReactModule.createElement(
        wrapperElementType,
        {
          [SURFACE_WRAPPER_ATTRIBUTE_NAME]: "1",
          [domAttributeName]: domAttributeValue,
          style,
          ref: localRef, // addSurfaceWrapper would have been false if a rep was passed in props
        },
        children
      );
    }

    if (
      !capability || // all default capabilities enabled
      capability.trackMutation !== false || // need mutation event
      capability.trackVisibilityThreshold // needs visibility event
    ) {
      /**
       * We don't know when react decides to call effect callback, so to be safe make a copy
       * of what we care about incase by the time callback is called the values have changed.
       */
      const triggerFlowlet = callFlowlet.data.triggerFlowlet;

      /**
       * either we are given a ref, or we use our local one. In anycase once
       * we have the node value, we can accurately assign the attribute, and
       * also use that for our mount/unmount event.
       */
      const nodeRef = props.nodeRef ?? localRef;

      children = ReactModule.createElement(
        SurfaceWithEvent,
        {
          nodeRef,
          domAttributeName,
          domAttributeValue,
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

    return ReactModule.createElement(
      SurfaceContext.Provider,
      {
        value: surfaceData
      },
      children
    );
  }

  SurfaceProxy.init({ ...options, surfaceComponent: Surface });

  return {
    surfaceComponent: Surface,
    surfaceHOComponent: (props, renderer) => {
      return children => {
        const result = ReactModule.createElement(
          Surface,
          props,
          renderer ? renderer(children) : children
        );

        return result;
      };
    }
  };
}
