/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";
import * as IElement from "@hyperion/hyperion-dom/src/IElement";
import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import * as IReactElementVisitor from '@hyperion/hyperion-react/src/IReactElementVisitor';
import * as IReactFlowlet from "@hyperion/hyperion-react/src/IReactFlowlet";
import * as IReactPropsExtension from "@hyperion/hyperion-react/src/IReactPropsExtension";
import * as Types from "@hyperion/hyperion-util/src/Types";
import type * as React from 'react';
import { ALFlowletDataType } from "./ALFlowletManager";
import * as ALIReactFlowlet from "./ALIReactFlowlet";
import { AUTO_LOGGING_NON_INTERACTIVE_SURFACE, AUTO_LOGGING_SURFACE } from './ALSurfaceConsts';
import * as ALSurfaceContext from "./ALSurfaceContext";
import type { SurfacePropsExtension } from "./ALSurfacePropsExtension";
import * as SurfaceProxy from "./ALSurfaceProxy";
import { ALMetadataEvent, ALSharedInitOptions } from "./ALType";


export type ALChannelSurfaceEventData = ALMetadataEvent & Readonly<{
  surface: string;
  element?: Element | null;
}>;

export enum ALSurfaceCapability {
  TrackInteraction = 1 << 0, // Mark all interaction events with this surface
  TrackMutation = 1 << 1, // report mount/unmount of this surface
  // TrackVisibility = 1 << 2, // track when mounted surface's visibility changes
  // TrackBoundingRect = 1 << 3, // Report the size of the bounding rect of the surface on the screen.
}

const AllSurfaceCapabilityValues = [
  ALSurfaceCapability.TrackInteraction,
  ALSurfaceCapability.TrackMutation,
];
const AllSurfaceCapabilityValuesString = AllSurfaceCapabilityValues.map(c => ALSurfaceCapability[c]).join(',');
function surfaceCapabilityToString(capability?: ALSurfaceCapability): string {
  if (!capability) {
    return AllSurfaceCapabilityValuesString;
  }

  return AllSurfaceCapabilityValues.filter(c => (capability & c) !== 0).map(c => ALSurfaceCapability[c]).join(',');
}

export type ALSurfaceProps = Readonly<{
  surface: string;
  metadata?: ALMetadataEvent['metadata'];
  capability?: ALSurfaceCapability, // a one-hot encoding what the surface can do.
  nodeRef?: React.MutableRefObject<HTMLElement | null | undefined>,
}>;

export type ALSurfaceRenderer = (node: React.ReactNode) => React.ReactElement;
export type ALSurfaceHOC = (props: ALSurfaceProps, renderer?: ALSurfaceRenderer) => ALSurfaceRenderer;

export type ALChannelSurfaceEvent = Readonly<{
  al_surface_mount: [ALChannelSurfaceEventData];
  al_surface_unmount: [ALChannelSurfaceEventData];
}>;

type DataType = ALFlowletDataType;
type FlowletType = Flowlet<DataType>;
type ALChannelEventType = ALChannelSurfaceEvent;
type ALChannel = Channel<ALChannelEventType>;


export type SurfaceComponent = (props:
  IReactPropsExtension.ExtendedProps<SurfacePropsExtension<DataType, FlowletType>> &
  Omit<ALSurfaceProps, 'surface'> &
  {
    flowlet: FlowletType;
    /** The optional incoming surface that we are re-wrapping via a proxy.
     * If this is provided,  then we won't emit mutations for this surface as we are
     * doubly wrapping that surface, for surface attribution purposes.
     */
    proxiedContext?: ALSurfaceContext.ALSurfaceContextFilledValue
  }
) => React.ReactElement;

export type InitOptions = Types.Options<
  ALSharedInitOptions &
  // IReactFlowlet.InitOptions<ALFlowletDataType, FlowletType, FlowletManagerType> &
  ALIReactFlowlet.InitOptions &
  ALSurfaceContext.InitOptions &
  SurfaceProxy.InitOptions &
  {
    react: {
      ReactModule: {
        createElement: typeof React.createElement;
        useLayoutEffect: typeof React.useLayoutEffect;
      };
      IReactModule: IReact.IReactModuleExports;
      IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports;
    };
    domFlowletAttributeName?: string;
    domNonInteractiveSurfaceAttributeName?: string;
    channel: ALChannel;
    disableReactDomPropsExtension?: boolean;
  }
>;

const SURFACE_SEPARATOR = "/";

class SurfaceDOMString<
  DataType extends ALFlowletDataType,
  FlowletType extends Flowlet<DataType>
> extends IReactFlowlet.PropsExtension<DataType, FlowletType> {
  surface: string | undefined;
  getSurface(): string | undefined {
    return this.surface;
  }

  toString(): string {
    return this.getSurface() ?? '';
  }
}

function setupDomElementSurfaceAttribute(options: InitOptions): void {
  if (options.disableReactDomPropsExtension) {
    return;
  }

  // We should make sure the following enabled for our particular usage in this function.
  IReactComponent.init(options.react);

  const { flowletManager, domSurfaceAttributeName = AUTO_LOGGING_SURFACE, domFlowletAttributeName, domNonInteractiveSurfaceAttributeName = AUTO_LOGGING_NON_INTERACTIVE_SURFACE } = options;
  /**
  * if flowlets are disabled, but we still want to extend the props, we use
  * the following placeholder flowlet to let the rest of the logic work.
  * This is safer than changing the whole logic since we will eventually
  * enable AM_AL_REACT_FLOWLET fully.
  */
  const UNKNOWN_FLOWLET = new flowletManager.flowletCtor('UNKNOWN');

  const allowedTags = new Set(['div', 'span', 'li', 'button']);

  IReactComponent.onReactDOMElement.add((component, props) => {
    const hasProps = props && typeof props === 'object';
    if (!hasProps) {
      return;
    }

    const flowlet = flowletManager.top() ?? UNKNOWN_FLOWLET;

    /**
     * This is a dom node and will directly go to dom later, i.e. all of its
     * props are directly added as attributes. So, just add necessary info
     * here in props.
     * We will set the surface attribute here, but for now it is null. Later
     * the <Surface> component will assigne value to the top DOM nodes under
     * its own tree. The null surface attributes will be filtered later.
     */
    if (allowedTags.has(component)) {
      props[domSurfaceAttributeName] = new SurfaceDOMString(flowlet);
      props[domNonInteractiveSurfaceAttributeName] = new SurfaceDOMString(flowlet);

      if (__DEV__) {
        if (domFlowletAttributeName) {
          /**
           * The following may add a lot of attributes to the dom nodes
           * But it is a good way to debug & validate the flow of flowlet on
           * mounted dom
           */
          props[domFlowletAttributeName] = flowlet.getFullName();
        }
      }
    }
    /**
     * The DOM node will be rendered directly, so we should make sure we
     * remove the __ext object from props so it does not show up as an
     * attribute of any node in the DOM.
     * __ext might be added when props of parent is copied to child via ...props
     */
    delete props.__ext;
  });

  /**
   * If a DOM node has a surface attribute with a null value, we want to make
   * sure that is not added to the DOM tree.
   * The following code blocks the effect of `setAttribute` by returning true
   */
  IElement.setAttribute.onArgsObserverAdd(function (
    this: Element,
    attrName,
    attrValue: any,
  ) {
    if (
      (
        attrName === domSurfaceAttributeName ||
        attrName === domNonInteractiveSurfaceAttributeName
      ) && (
        attrValue === '' ||
        attrValue === 'null' ||
        (attrValue instanceof SurfaceDOMString && attrValue.toString() === '')
      )
    ) {
      return true;
    }
    return false;
  });
}


export function init(options: InitOptions): ALSurfaceHOC {
  const { flowletManager, domSurfaceAttributeName = AUTO_LOGGING_SURFACE, domNonInteractiveSurfaceAttributeName = AUTO_LOGGING_NON_INTERACTIVE_SURFACE } = options;
  const { ReactModule } = options.react;

  ALIReactFlowlet.init(options);

  setupDomElementSurfaceAttribute(options);
  const SurfaceContext = ALSurfaceContext.init(options);

  type SurfaceData = ALSurfaceContext.ALSurfaceContextFilledValue & {
    domAttributeName: string;
    domAttributeValue: string;
  }

  const Surface: SurfaceComponent = props => {
    const { __ext, flowlet, proxiedContext } = props;
    if (__ext && __ext.flowlet !== flowlet) {
      __ext.flowlet = flowlet;
    }

    let surfacePath: string;
    let nonInteractiveSurfacePath: string;
    let domAttributeName: string;
    let domAttributeValue: string;

    const surfaceCtx = ALSurfaceContext.useALSurfaceContext();
    const { surface: parentSurface, nonInteractiveSurface: parentNonInteractiveSurface } = surfaceCtx;

    if (!proxiedContext) {
      const surface = flowlet.name;
      nonInteractiveSurfacePath = (parentNonInteractiveSurface ?? '') + SURFACE_SEPARATOR + surface;
      const trackInteraction = props.capability == null || (props.capability & ALSurfaceCapability.TrackInteraction); // empty .capability field is default, means all enabled!
      if (!trackInteraction) {
        surfacePath = parentSurface ?? SURFACE_SEPARATOR;
        domAttributeName = domNonInteractiveSurfaceAttributeName;
        domAttributeValue = nonInteractiveSurfacePath;
      } else {
        surfacePath = (parentSurface ?? '') + SURFACE_SEPARATOR + surface;
        domAttributeName = domSurfaceAttributeName;
        domAttributeValue = surfacePath;
      }
    } else {
      surfacePath = proxiedContext.surface;
      nonInteractiveSurfacePath = proxiedContext.nonInteractiveSurface;
      domAttributeName = domSurfaceAttributeName
      domAttributeValue = surfacePath;
    }

    const surfaceData: SurfaceData = {
      surface: surfacePath,
      nonInteractiveSurface: nonInteractiveSurfacePath,
      flowlet,
      domAttributeName,
      domAttributeValue,
    };

    if (options.channel && !proxiedContext) {
      const { channel } = options;
      // Emit surface mutation events on mount/unmount
      const metadata = props.metadata ?? {}; // Note that we want the same object to be shared between events to share the changes.
      metadata.original_flowlet = flowlet.getFullName();

      metadata.surface_capability = surfaceCapabilityToString(props.capability);

      ReactModule.useLayoutEffect(() => {
        const event: ALChannelSurfaceEventData = {
          surface: domAttributeValue,
          metadata,
          element: document.querySelector(`[${domAttributeName}='${domAttributeValue}']`)
        };
        channel.emit('al_surface_mount', event);
        return () => {
          channel.emit('al_surface_unmount', event);
        }
      }, [domAttributeName, domAttributeValue]);
    }

    ReactModule.useLayoutEffect(() => {
      nodeRef && console.log('danika in useEffect', {nodeRef, current: nodeRef.current})
      nodeRef && nodeRef.current?.setAttribute(domAttributeName, domAttributeValue);
      console.log('danika in useEffect after', {nodeRef, x: nodeRef?.current?.getAttributeNames()});
      // ref.current is only not null after subsequent render. This is because ref.current will only get initialized when the <div/> has mounted. I think the Surface wrapper mounts first.
      });

      const {nodeRef} = props;
    nodeRef && console.log('danika', {nodeRef, current: nodeRef.current})
    if(nodeRef?.current != null){
      // we never hit here
      nodeRef.current?.setAttribute(domAttributeName, domAttributeValue);
      console.log('danika after', {nodeRef, x: nodeRef.current.getAttributeNames()});
    }

    flowlet.data.surface = surfacePath;
    let children = props.children;

    if (!options.disableReactDomPropsExtension) {
      const foundDomElement = propagateFlowletDown(props.children, surfaceData);

      if (foundDomElement !== true) {
        /**
         * We could not find a dom node to safely add the attribute to it.
         *
         * We wrap the content in a dom node ourselves. Note that this will trigger
         * all the right logic and automatically add the attributes for us, and
         * this time we should succeed propagating surface/flowlet down.
         * This option works in almost all cases, but later we add an option to
         * the surface to prevent this option and fall back to the more expensive
         * algorithm as before (will add later)
         *
         */
        children = ReactModule.createElement(
          "span",
          {
            "data-surface-wrapper": "1",
            style: { display: 'contents' }
          },
          props.children
        );
        propagateFlowletDown(children, surfaceData);
      }
    } else {
      children = ReactModule.createElement(
        "span",
        {
          "data-surface-wrapper": "1",
          style: { display: 'contents' },
          [domAttributeName]: domAttributeValue,
        },
        props.children
      );
    }

    // We want to override the intercepted values
    flowletManager.push(flowlet);
    const result = ReactModule.createElement(
      SurfaceContext.Provider,
      {
        value: surfaceData
      },
      children
    );
    flowletManager.pop(flowlet);
    return result;
  }

  SurfaceProxy.init({ ...options, surfaceComponent: Surface });

  function updateFlowlet(
    ext: IReactFlowlet.PropsExtension<DataType, FlowletType> | undefined,
    params: SurfaceData,
    children: React.ReactNode,
    deep: boolean,
  ): boolean | undefined | null {
    if (!ext || !(ext instanceof IReactFlowlet.PropsExtension/* <DataType, FlowletType> */)) {
      return;
    }

    const extFlowlet = ext.flowlet;
    if (!extFlowlet) {
      return;
    }

    if (extFlowlet.data.surface !== params.flowlet.data.surface) {
      ext.flowlet = params.flowlet;
    }
    if (deep) {
      return propagateFlowletDown(children, params);
    }
    return;
  }


  type IDomElementExtendedProps = IReactPropsExtension.ExtendedProps<SurfacePropsExtension<DataType, FlowletType>> & {
    [index: string]: SurfaceDOMString<DataType, FlowletType>;
  }

  const propagateFlowletDown = IReactElementVisitor.createReactNodeVisitor<
    IDomElementExtendedProps,
    IReactPropsExtension.ExtendedProps<SurfacePropsExtension<DataType, FlowletType>>,
    SurfaceData,
    boolean | undefined
  >({
    domElement: (_component, props, params, _node) => {
      const ext = props[params.domAttributeName];
      if (ext instanceof SurfaceDOMString) {
        ext.surface = params.domAttributeValue;
      }
      updateFlowlet(ext, params, props.children, false);
      return true;
    },
    component: (component, props, params, _node) => {
      if (component !== Surface) {
        return updateFlowlet(props.__ext, params, props.children, true);
      }
      return;
    },
    memo: (_component, _props, params, node) => {
      let result: boolean | undefined;
      for (
        // @ts-ignore
        let fiberNode = node?._owner;
        fiberNode;
        fiberNode = fiberNode.sibling
      ) {
        const memoized = fiberNode.memoizedProps;
        const pending = fiberNode.pendingProps;
        if (memoized) {
          result =
            updateFlowlet(memoized.__ext, params, memoized.children, true) ||
            result;
        }

        if (memoized !== pending && pending) {
          result =
            updateFlowlet(pending.__ext, params, pending.children, true) ||
            result;
        }
      }
      return result;
    },
    __default: (_component, props, params, _node) => {
      return updateFlowlet(props.__ext, params, props.children, true);
    },
  });

  return ({ surface, ...rest }, renderer) => {
    const topFlowlet = flowletManager.top();

    let flowlet: FlowletType;
    if (topFlowlet == null || topFlowlet?.name !== surface) {
      flowlet = flowletManager.push(new flowletManager.flowletCtor(surface, topFlowlet));
      flowlet.data.surface =
        (flowlet.parent?.data?.surface ?? '') + SURFACE_SEPARATOR + surface;
    } else {
      flowlet = topFlowlet;
    }

    return children => {
      const result = ReactModule.createElement(
        Surface,
        {
          flowlet,
          ...rest
        },
        renderer ? renderer(children) : children
      );

      flowletManager.pop(flowlet);
      return result;
    };
  };
}
