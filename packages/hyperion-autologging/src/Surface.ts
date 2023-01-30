/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as IElement from "@hyperion/hyperion-dom/src/IElement";
import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import * as IReactElementVisitor from '@hyperion/hyperion-react/src/IReactElementVisitor';
import * as IReactFlowlet from "@hyperion/hyperion-react/src/IReactFlowlet";
import * as IReactPropsExtension from "@hyperion/hyperion-react/src/IReactPropsExtension";
import type * as React from 'react';
import { AUTO_LOGGING_SURFACE } from './SurfaceConsts';
import * as ALSurfaceContext from "./ALSurfaceContext";

type ALChannelSurfaceData = Readonly<{
  surface: string,
}>;

export type ALSurfaceProps = Readonly<{
  surface: string,
}>;

/**
 * We want to allow type of flowlet to be passed here. the only thing we need
 * from the data type is the `surface` field. Sonce, ALFlowlet may change
 * overtime, we don't want to create an uncessary dependency on that.
 */
interface FlowletDataType {
  surface?: string,
};

export type ALSurfaceRenderer = (node: React.ReactNode) => React.ReactElement;
export type ALSurfaceHOC = (props: ALSurfaceProps, renderer?: ALSurfaceRenderer) => ALSurfaceRenderer;

export type ALChannelSurfaceEvent = Readonly<{
  al_surface_mount: [ALChannelSurfaceData],
  al_surface_unmount: [ALChannelSurfaceData],
}>;

type InitOptions<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>
> = Readonly<ALSurfaceContext.InitOptions & {
  ReactModule: {
    createElement: typeof React.createElement;
  };
  IReactModule: IReact.IReactModuleExports;
  IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports;
  flowletManager: FlowletManagerType;
  domSurfaceAttributeName?: string;
  domFlowletAttributeName?: string;
  // channel?: ALChannel,
}>;

const SURFACE_SEPARATOR = "/";

class SurfaceDOMString<
  DataType extends FlowletDataType,
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

function setupDomElementSurfaceAttribute<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>,
>(options: InitOptions<DataType, FlowletType, FlowletManagerType>): void {
  const { flowletManager, domSurfaceAttributeName = AUTO_LOGGING_SURFACE, domFlowletAttributeName } = options;
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
    attrValue,
  ) {
    if (
      attrName === domSurfaceAttributeName &&
      (attrValue === 'null' || attrValue === '')
    ) {
      return true;
    }
    return false;
  });
}

export function init<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>,
// ALChannelEventType extends ALChannelSurfaceEvent,
// ALChannel extends  FastEventEmitter<ALChannelEventType>,
>(options: InitOptions<DataType, FlowletType, FlowletManagerType>): ALSurfaceHOC {
  const { ReactModule, IReactModule, IJsxRuntimeModule, flowletManager, domSurfaceAttributeName = AUTO_LOGGING_SURFACE } = options;

  IReactFlowlet.init<DataType, FlowletType, FlowletManagerType>(
    IReactModule,
    IJsxRuntimeModule,
    flowletManager
  ); // extensionCtor

  setupDomElementSurfaceAttribute<DataType, FlowletType, FlowletManagerType>(options);
  const SurfaceContext = ALSurfaceContext.init(options);

  class SurfacePropsExtension extends IReactFlowlet.PropsExtension<DataType, FlowletType>  {
    getSurface(): string | undefined {
      return this.flowlet?.data.surface;
    }
  }

  function Surface(props: IReactPropsExtension.ExtendedProps<SurfacePropsExtension> & {
    flowlet: FlowletType,
    flowletManager: FlowletManagerType,
  }): React.ReactElement {
    const { __ext, flowlet, flowletManager } = props;
    if (__ext && __ext.flowlet !== flowlet) {
      __ext.flowlet = flowlet;
    }

    const surface = flowlet.name;
    const { surface: parentSurface } = ALSurfaceContext.useALSurfaceContext();
    const fullSurfaceString =
      (parentSurface ?? '') + SURFACE_SEPARATOR + surface;

    // // Emit surface mutation events on mount/unmount
    // React.useLayoutEffect(() => {
    //   if (gkx('am_al_surface_mutation_v2')) {
    //     channel?.emit('al_surface_mount', { surface: fullSurfaceString });
    //     return () =>
    //       channel?.emit('al_surface_unmount', { surface: fullSurfaceString });
    //   }
    // }, [fullSurfaceString]);

    flowlet.data.surface = fullSurfaceString;
    let children = props.children;

    const foundDomElement = propagateFlowletDown(props.children, flowlet);

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
      children = ReactModule.createElement("span", { style: { display: 'contents' } }, props.children);
      propagateFlowletDown(children, flowlet);
    }

    // We want to override the intercepted values
    flowletManager.push(flowlet);
    const result = ReactModule.createElement(SurfaceContext.Provider, { value: { surface: fullSurfaceString } }, children);
    flowletManager.pop(flowlet);
    return result;
  }

  function updateFlowlet(
    ext: IReactFlowlet.PropsExtension<DataType, FlowletType> | undefined,
    flowlet: FlowletType,
    children: React.ReactNode,
    deep: boolean,
  ): boolean | undefined | null {
    if (!ext || !(ext instanceof IReactFlowlet.PropsExtension<DataType, FlowletType>)) {
      return;
    }

    const extFlowlet = ext.flowlet;
    if (!extFlowlet) {
      return;
    }

    if (extFlowlet.data.surface !== flowlet.data.surface) {
      ext.flowlet = flowlet;
    }
    if (deep) {
      return propagateFlowletDown(children, flowlet);
    }
    return;
  }


  type IDomElementExtendedProps = IReactPropsExtension.ExtendedProps<SurfacePropsExtension> & {
    [index: string]: SurfaceDOMString<DataType, FlowletType>;
  }

  const propagateFlowletDown = IReactElementVisitor.createReactNodeVisitor<
    IDomElementExtendedProps,
    IReactPropsExtension.ExtendedProps<SurfacePropsExtension>,
    FlowletType,
    boolean | undefined
  >({
    domElement: (_component, props, flowlet, _node) => {
      const ext = props[domSurfaceAttributeName];
      if (ext instanceof SurfaceDOMString) {
        ext.surface = flowlet.data.surface;
      }
      updateFlowlet(ext, flowlet, props.children, false);
      return true;
    },
    component: (component, props, flowlet, _node) => {
      if (component !== Surface) {
        return updateFlowlet(props.__ext, flowlet, props.children, true);
      }
      return;
    },
    memo: (_component, _props, flowlet, node) => {
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
            updateFlowlet(memoized.__ext, flowlet, memoized.children, true) ||
            result;
        }

        if (memoized !== pending && pending) {
          result =
            updateFlowlet(pending.__ext, flowlet, pending.children, true) ||
            result;
        }
      }
      return result;
    },
    __default: (_component, props, flowlet, _node) => {
      return updateFlowlet(props.__ext, flowlet, props.children, true);
    },
  });

  return ({ surface }, renderer) => {
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
          flowletManager,
        },
        renderer ? renderer(children) : children
      );

      flowletManager.pop(flowlet);
      return result;
    };
  };
}


