/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";

import type * as Types from "@hyperion/hyperion-util/src/Types";

import { assert } from "@hyperion/global";
import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import { ALFlowlet, ALFlowletManager } from "./ALFlowletManager";
import { ALSurfaceContext, useALSurfaceContext } from "./ALSurfaceContext";

export type InitOptions<> = Types.Options<
  IReactComponent.InitOptions &
  {
    IReactModule: IReact.IReactModuleExports;
    flowletManager: ALFlowletManager;
    disableReactFlowlet?: boolean;
  }
>;

let initialized = new TestAndSet();
export function init(options: InitOptions) {
  if (initialized.testAndSet() || options.disableReactFlowlet) {
    return;
  }

  IReactComponent.init(options);

  const { flowletManager, IReactModule } = options;

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

  type ComponentWithFlowlet = React.Component<any> & {
    _flowlet?: ALFlowlet | null | undefined
  };

  IReactComponent.onReactClassComponentIntercept.add(shadowComponent => {
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
      if (method.getData<boolean>(IS_FLOWLET_SETUP_PROP)) {
        return;
      }
      method.setData(IS_FLOWLET_SETUP_PROP, true);

      if (method === shadowComponent.render) {
        method.onArgsObserverAdd(function (this: ComponentWithFlowlet) {
          /**
              * We cannot call hooks inside of the class components.
              * Also, a class component can only have a single context assigned to it.
              * So, we use this internal api/hack to get the value.
              * This is ok, because this is a best effort and anyways most people are
              * migrating away from class components.
              */
          const ctx = (ALSurfaceContext as any)._currentValue; // Unofficial internal value
          const activeFlowlet = ctx?.flowlet;
          if (activeFlowlet) {
            flowletManager.push(activeFlowlet);
            this._flowlet = activeFlowlet;
          }
        });
      } else {
        method.onArgsObserverAdd(function (this: ComponentWithFlowlet) {
          const activeFlowlet = this._flowlet;
          if (activeFlowlet) {
            flowletManager.push(activeFlowlet);
          }
        });
      }

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
      if (!fi.getData<boolean>(IS_FLOWLET_SETUP_PROP)) {
        fi.setData(IS_FLOWLET_SETUP_PROP, true);

        let activeFlowlet: ALFlowlet | undefined | null;
        fi.onArgsObserverAdd(_props => {
          const ctx = useALSurfaceContext();
          activeFlowlet = ctx.flowlet;
          if (activeFlowlet) {
            flowletManager.push(activeFlowlet)
          }
        });
        fi.onValueObserverAdd(() => {
          if (activeFlowlet) {
            if (__DEV__) {
              assert(
                activeFlowlet === useALSurfaceContext().flowlet,
                "Invalid situation! The active flowlet changed!"
              );
            }
            flowletManager.pop(activeFlowlet);
          }
        });
      }
    },
  );

}