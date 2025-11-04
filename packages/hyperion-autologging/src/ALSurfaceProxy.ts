/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';


import * as IReactDOM from "hyperion-react/src/IReactDOM";
import * as Types from "hyperion-util/src/Types";
import type * as React from 'react';
import { useALSurfaceContext } from './ALSurfaceContext';
import { SurfaceImpl } from "./ALSurface";
import { ReactModule } from "hyperion-react/src/IReact";


export type InitOptions = Types.Options<{
  react: {
    // ReactModule: { createElement: typeof React.createElement, Fragment: typeof React.Fragment };
    IReactDOMModule: IReactDOM.IReactDOMModuleExports | Promise<IReactDOM.IReactDOMModuleExports>;
  };
}>;

/**
 * We need to use a hook to get the surface value, but the rules of using
 * hooks won't allow us to call it outside of a react component.
 * So, the following proxy component is purely for getting around this
 * limitation and reading the current surface value during rendering.
 * If we can find a way around this limitation, we can use a simpler logic
 * like the following:
 */
function SurfaceProxy(props: React.PropsWithChildren<{ container: Element | DocumentFragment }>): React.ReactNode {
  const { children, container } = props;
  const surfaceContext = useALSurfaceContext();
  if (surfaceContext.surface == null) {
    // return ReactModule.createElement(ReactModule.Fragment, {}, children);
    return children;
  }

  const { domAttributeName, domAttributeValue, capability, callFlowlet, metadata } = surfaceContext;

  const nodeRef = ReactModule.get().useRef<Element>();

  if (container instanceof Element &&
    (container.childElementCount === 0 || container.getAttribute(domAttributeName) === domAttributeValue)
  ) {
    container.setAttribute(domAttributeName, domAttributeValue);
    nodeRef.current = container; // will disable wrapper
  }

  return ReactModule.get().createElement(
    SurfaceImpl,
    {
      wrapperElementType: container instanceof SVGElement ? "g" : "span",
      capability,
      domAttributeName,
      domAttributeValue,
      surfaceData: surfaceContext,
      callFlowlet,
      metadata,
      isProxy: true,
      nodeRef: nodeRef.current != null ? nodeRef : null,
    },
    children
  );
}

export function init(options: InitOptions): void {
  const { IReactDOMModule } = options.react;

  /**
   * In case an application loads ReactDOM dynamically and on demand,
   * the following will allow an async configuration of the logic
   */
  if (IReactDOMModule instanceof Promise) {
    IReactDOMModule.then(iReactDOMModule => {
      init({
        ...options,
        react: {
          ...options.react,
          IReactDOMModule: iReactDOMModule,
        }
      })
    });

    return;
  }

  /**
   * When createPortal is called, the react components will be added to a
   * separate container DOM node and shown in place later.
   * Although DOM tree hierarchy is broken, the React Context hierarchy will
   * continue to work. So, we use that fact and wrap the node in another Surface
   * with the same flowlet and surface from the original surface context.
   */
  IReactDOMModule.createPortal.onBeforeCallMapperAdd(args => {
    const [node, container] = args;

    if (node != null) {
      args[0] = ReactModule.get().createElement(SurfaceProxy, { ...options, container }, node);
    }
    return args;
  });

}
