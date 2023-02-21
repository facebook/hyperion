/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';


import type * as React from 'react';
import { useALSurfaceContext } from './ALSurfaceContext';
import * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";
import { SurfacePropsExtension } from './ALSurfacePropsExtension';
import { FlowletManagerType, SurfaceComponent } from './ALSurface';
import { assert } from '@hyperion/global';


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
    flowletManager: FlowletManagerType;
  }>;

type ProxyInitOptions =
  InitOptions &
  // Additional options that will be passed from within ALSurface
  Readonly<{
    surfaceComponent: SurfaceComponent;
  }>;

export function init(options: ProxyInitOptions): void {
  const { IReactDOMModule, ReactModule, flowletManager } = options;
  /**
   * When createPortal is called, the react components will be added to a
   * separate container DOM node and shown in place later.
   * Although DOM tree hierarchy is broken, the React Context hierarchy will
   * continue to work. So, we use that fact and wrap the node in another Surface
   * with the same flowlet and surface from the original surface context.
   */
  IReactDOMModule.createPortal.onArgsMapperAdd(args => {
    const [node, _container] = args;

    if (node != null) {
      const { surface, flowlet } = useALSurfaceContext();
      assert(surface != null, 'Surface cannot be null when proxying Surface.');
      assert(flowlet != null, 'Flowlet cannot be null when proxying Surface.');
      args[0] = ReactModule.createElement(
        options.surfaceComponent,
        {
          __ext: new SurfacePropsExtension(flowlet),
          flowlet: flowlet,
          flowletManager: flowletManager,
          fullSurfaceString: surface,
        },
        node
      );
    }
    return args;
  });

}
