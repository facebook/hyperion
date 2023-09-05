/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";

import type * as Types from "@hyperion/hyperion-util/src/Types";
import type * as React from 'react';

import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import { ALFlowlet, ALFlowletManager } from "./ALFlowletManager";
import { ALSurfaceContext, useALSurfaceContext } from "./ALSurfaceContext";

export type InitOptions<> = Types.Options<
  {
    react: IReactComponent.InitOptions & {
      ReactModule: {
        useRef: <T>(initialValue: T) => React.MutableRefObject<T>;
        createElement: typeof React.createElement;
        Fragment: typeof React.Fragment;
      }
      IReactModule: IReact.IReactModuleExports;
    };
    flowletManager: ALFlowletManager;
    disableReactFlowlet?: boolean;
  }
>;

let initialized = new TestAndSet();
export function init(options: InitOptions) {
  if (initialized.testAndSet() || options.disableReactFlowlet) {
    return;
  }

  IReactComponent.init(options.react);

  const { flowletManager } = options;
  const { IReactModule } = options.react;

  [
    IReactModule.useCallback,
    IReactModule.useEffect,
    IReactModule.useLayoutEffect,
    IReactModule.useReducer
  ].forEach(fi => {
    fi.onArgsMapperAdd(args => {
      args[0] = flowletManager.wrap(args[0], fi.name);
      return args;
    });
  });
  IReactModule.useState.onValueMapperAdd(value => {
    value[1] = flowletManager.wrap(value[1], IReactModule.useState.name);
    return value;
  });

  /**
 * The following interceptor methods (onArgsObserver/onValueObserver) run immediately 
 * before & after intercepted method. So, we can push before and pop after so that
 * the body of the method has access to flowlet.
 * For class components, we store the flowlet in the `this` object.
 * For function components, we have to keep that value and close on it (we could use useRef)
 */

  const IS_FLOWLET_SETUP_PROP = 'isFlowletSetup';

  type FlowletRef = {
    _flowlet?: ALFlowlet | null | undefined
  };
  type ComponentWithFlowlet = React.Component<any> & FlowletRef;

  IReactComponent.onReactClassComponentIntercept.add(shadowComponent => {
    const ictor = shadowComponent.ctor;
    const component: any = ictor.getOriginal();

    /**
     * Just achieve more coverage, for legacy components, if there is not context defined
     * we use the https://legacy.reactjs.org/docs/legacy-context.html model to get a context
     * assigned to the component and then read the surface info from there
     */
    if (!component.contextType && !component.contextTypes) {
      component.contextType = ALSurfaceContext; // Just to be consistent
      (ictor.interceptor as any).contextType = ALSurfaceContext; // the real constructor used by the application

      ictor.onValueObserverAdd((value: ComponentWithFlowlet & { context?: any }) => {
        value._flowlet = value.context?.flowlet;
      });
    }

    const methods = [
      shadowComponent.render,
      shadowComponent.componentWillMount,
      shadowComponent.componentDidMount,
      shadowComponent.componentWillReceiveProps,
      shadowComponent.shouldComponentUpdate,
      shadowComponent.componentWillUpdate,
      shadowComponent.componentDidUpdate,
      shadowComponent.componentWillUnmount,
      shadowComponent.componentDidCatch,
    ];

    methods.forEach(method => {
      if (method.testAndSet(IS_FLOWLET_SETUP_PROP)) {
        return;
      }

      method.onArgsObserverAdd(function (this: ComponentWithFlowlet) {
        const activeFlowlet = this._flowlet;
        if (activeFlowlet) {
          flowletManager.push(activeFlowlet);
        }
      });

      method.onValueObserverAdd(function (this: ComponentWithFlowlet) {
        const activeFlowlet = this._flowlet;
        if (activeFlowlet) {
          flowletManager.pop(activeFlowlet);
        }
      });
    });
  });

  IReactComponent.onReactFunctionComponentIntercept.add(
    fi => {
      if (!fi.testAndSet(IS_FLOWLET_SETUP_PROP)) {

        fi.onArgsAndValueMapperAdd(([_props]) => {
          const ctx = useALSurfaceContext();
          const activeFlowlet = ctx?.flowlet;
          if (activeFlowlet) {
            flowletManager.push(activeFlowlet);
            return (value) => {
              flowletManager.pop(activeFlowlet);
              return value;
            };
          } else {
            return value => value; // Nothing to do here
          }
        });

      }
    },
  );

}


