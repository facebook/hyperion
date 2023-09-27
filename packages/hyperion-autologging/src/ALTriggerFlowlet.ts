/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";

import type * as Types from "@hyperion/hyperion-util/src/Types";
import type * as React from 'react';

import { Channel } from "@hyperion/hook/src/Channel";
import { getFunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { TriggerFlowlet } from "@hyperion/hyperion-flowlet/src/TriggerFlowlet";
import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import { ALFlowlet, ALFlowletManager } from "./ALFlowletManager";
import { ALChannelSurfaceEvent } from "./ALSurface";
import { ALSurfaceContext, ALSurfaceContextFilledValue, useALSurfaceContext } from "./ALSurfaceContext";
import { ALChannelUIEvent } from "./ALUIEventPublisher";

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
    channel: Channel<ALChannelSurfaceEvent & ALChannelUIEvent>;
    disableReactFlowlet?: boolean;
  }
>;

let initialized = new TestAndSet();
export function init(options: InitOptions) {
  if (initialized.testAndSet()) {
    return;
  }

  const { channel, flowletManager } = options;

  const ALSurfaceContextDataMap = new Map<ALSurfaceContextFilledValue['surface'], ALSurfaceContextFilledValue['flowlet']>();
  const activeRootFlowlets = new Set<ALFlowlet>();

  function setSurfaceTriggerFlowlet(surface: string | null, triggerFlowlet: TriggerFlowlet | null | undefined): void {
    if (!triggerFlowlet) {
      return; // nothing to do
    }

    if (!surface) {
      // We don't know the actual surface (options are off!) update everything
      for (const root of activeRootFlowlets) {
        root.data.triggerFlowlet = triggerFlowlet;
      }
      return;
    }

    // The following may not happen until react interception and flowlets actually are enabled. 
    const surfaceFlowlet = ALSurfaceContextDataMap.get(surface);
    if (surfaceFlowlet) {
      surfaceFlowlet.data.triggerFlowlet = triggerFlowlet;
    }

  }


  // Track surface flowlet roots
  channel.addListener('al_surface_mount', event => {
    const { surface, flowlet } = event;
    ALSurfaceContextDataMap.set(surface, flowlet);
    let rootFlowlet = flowlet;
    while (rootFlowlet.parent) {
      rootFlowlet = rootFlowlet.parent;
    }
    activeRootFlowlets.add(rootFlowlet);
  });
  channel.addListener('al_surface_unmount', event => {
    ALSurfaceContextDataMap.delete(event.surface);
    activeRootFlowlets.delete(event.flowlet);
  });

  // Assign triggers to surface flowlets
  channel.addListener('al_ui_event_capture', event => {
    setSurfaceTriggerFlowlet(event.surface, event.triggerFlowlet);
  });

  /**
   * We wrapp the callback function of the following api to ensure they can
   * make a copy of the triggerFlowlet based on the semantics of the FlowletManager.wrap()
   * which means once they are called, they have a copy of this token and we can change the
   * activeRootFlowlets safely later.
   */
  const { IReactModule } = options.react;

  [
    IReactModule.useCallback,
  ].forEach(fi => {
    fi.onArgsMapperAdd(args => {
      args[0] = flowletManager.wrap(args[0], fi.name);
      return args;
    });
  });

  [
    IReactModule.useEffect,
    IReactModule.useLayoutEffect,
  ].forEach(fi => {
    fi.onArgsMapperAdd(args => {
      args[0] = flowletManager.wrap(args[0], fi.name);
      const setupInterceptor = getFunctionInterceptor(args[0]);
      setupInterceptor?.onValueMapperAdd(cleanup => {
        if (cleanup) {
          return flowletManager.wrap(cleanup, fi.name + `_cleanup`);
        } else {
          return cleanup;
        }
      });
      return args;
    });
  });

  [
    IReactModule.useState,
    IReactModule.useReducer
  ].forEach(fi => {
    fi.onValueMapperAdd(value => {
      value[1] = flowletManager.wrap(value[1], fi.name);
      const setterInterceptor = getFunctionInterceptor(value[1]);
      setterInterceptor?.onArgsObserverAdd(() => {
        /**
         * when someone calls the setter, before anything happens we pickup the
         * trigger flowlet from the top of the stack. 
         * Then we assign this trigger flowlet to all surfcce flowlet roots so that
         * any other method that is called during rending of the components can see the trigger.
         * 
         * Since the wrapped setter will call .push() after args observer is called,
         * we can still access .top() of the caller.
         */
        const triggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
        setSurfaceTriggerFlowlet(null, triggerFlowlet);
      });
      return value;
    });
  });

  IReactModule.useState.onValueMapperAdd(value => {
    value[1] = flowletManager.wrap(value[1], IReactModule.useState.name);
    const setterInterceptor = getFunctionInterceptor(value[1]);
    setterInterceptor?.onArgsObserverAdd(() => {
      /**
       * when someone calls the setter, before anything happens we pickup the
       * trigger flowlet from the top of the stack. 
       * Then we assign this trigger flowlet to all surfcce flowlet roots so that
       * any other method that is called during rending of the components can see the trigger.
       * 
       * Since the wrapped setter will call .push() after args observer is called,
       * we can still access .top() of the caller.
       */
      const triggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
      setSurfaceTriggerFlowlet(null, triggerFlowlet);
    });

    return value;
  });

  if (options.disableReactFlowlet) return;
  IReactComponent.init(options.react);


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


