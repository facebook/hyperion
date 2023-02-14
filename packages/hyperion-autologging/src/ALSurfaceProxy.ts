/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';


import * as React from 'react';
import { useALSurfaceContext } from './ALSurfaceContext';
import * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";
import { FlowletDataType, SurfaceComponent, SurfacePropsExtension } from './Types';
import { Flowlet } from '@hyperion/hyperion-flowlet/src/Flowlet';
import { FlowletManager } from '@hyperion/hyperion-flowlet/src/FlowletManager';


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

export type InitOptions<DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>> =
  Readonly<{
    ReactModule: { createElement: typeof React.createElement };
    IReactDOMModule: IReactDOM.IReactDOMModuleExports;
    surfaceComponent?: SurfaceComponent<DataType, FlowletType, FlowletManagerType>;
    flowletManager: FlowletManagerType;
  }>;

export function init<DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>>(options: InitOptions<DataType, FlowletType, FlowletManagerType>): void {
  const { IReactDOMModule, ReactModule, flowletManager } = options;

  /**
   * When createPortal is called, the react components will be added to a
   * separate container DOM node and shown in place later.
   * Although DOM tree hierarchy is broken, the React Context hierarchy will
   * continue to work. So, we use that fact and assign the right surface attribute
   * to the container node. This way, when we walk up the DOM tree, we find the
   * right surface value.
   */

  /**
   * When createPortal is called, the react components will be added to a
   * separate container DOM node and shown in place later.
   * Although DOM tree hierarchy is broken, the React Context hierarchy will
   * continue to work. So, we use that fact and assign the right surface attribute
   * to the container node. This way, when we walk up the DOM tree, we find the
   * right surface value.
   */
  IReactDOMModule.createPortal.onArgsMapperAdd(args => {
    const [node, _container] = args;

    if (node != null && React.isValidElement(node)) {
      const { surface, flowlet: surfaceFlowlet } = useALSurfaceContext<DataType, FlowletType>();
      if (surface != null) {
        // If the surface of the flowlet is the same surface as the one we are proxy wrapping
        // because of portal, pass that to this wrapping surface component.
        let flowlet = surfaceFlowlet;
        if (flowlet == null) {
          const topFlowlet = flowletManager.top();
          if (topFlowlet == null || topFlowlet?.name !== surface) {
            flowlet = flowletManager.push(new flowletManager.flowletCtor(surface, topFlowlet));
          } else {
            flowlet = topFlowlet;
          }
        }
        if (options.surfaceComponent) {
          args[0] = ReactModule.createElement(
            options.surfaceComponent,
            {
              __ext: new SurfacePropsExtension<FlowletDataType, FlowletType>(flowlet),
              flowlet: flowlet,
              flowletManager: flowletManager,
              fullSurfaceString: surface,
            },
            node
          );
        }
      }
    }
    return args;
  });

}
