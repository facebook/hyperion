/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';


import type * as React from 'react';
import { useALSurfaceContext } from './ALSurfaceContext';
import { AUTO_LOGGING_SURFACE } from "./SurfaceConsts";
import * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";


/**
 * We need to use a hook to get the surface value, but the rules of using
 * hooks won't allow us to call it outside of a react component.
 * So, the following proxy component is purely for getting around this
 * limitation and reading the current surface value during rendering.
 * If we can find a way around this limitation, we can use a simpler logic
 * like the following:
 *
 *  ALIReactDOM.createPortal.onArgsObserverAdd((_node, container) => {
 *    if (container instanceof HTMLElement) {
 *      const {surface} = useALSurfaceContext();
 *      if (surface != null) {
 *        container.setAttribute(AUTO_LOGGING_SURFACE, surface);
 *      }
 *    }
 *  });
 */
// function SurfaceProxy(props: React.PropsWithChildren<{
//   container: HTMLElement,
// }>) {
//   const { container } = props;
//   const { surface } = useALSurfaceContext();
//   if (surface != null) {
//     container.setAttribute(AUTO_LOGGING_SURFACE, surface);
//   }

//   return props.children;
// }

export type InitOptions =
  Readonly<{
    ReactModule: { createElement: typeof React.createElement };
    IReactDOMModule: IReactDOM.IReactDOMModuleExports;
    domSurfaceAttributeName?: string;
  }>;

export function init(options: InitOptions): void {
  const { domSurfaceAttributeName = AUTO_LOGGING_SURFACE, IReactDOMModule } = options;

  /**
   * When createPortal is called, the react components will be added to a
   * separate container DOM node and shown in place later.
   * Although DOM tree hierarchy is broken, the React Context hierarchy will
   * continue to work. So, we use that fact and assign the right surface attribute
   * to the container node. This way, when we walk up the DOM tree, we find the
   * right surface value.
   */
  IReactDOMModule.createPortal.onArgsMapperAdd(args => {
    const [_node, container] = args;
    if (container instanceof HTMLElement) {
      // args[0] = options.ReactModule.createElement(SurfaceProxy, { container }, node);
      const { surface } = useALSurfaceContext();
      if (surface != null) {
        container.setAttribute(domSurfaceAttributeName, surface);
      }
    }
    return args;
  });

}