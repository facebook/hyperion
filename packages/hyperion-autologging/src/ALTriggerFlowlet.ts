/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import type * as Types from "@hyperion/hyperion-util/src/Types";
import type * as React from 'react';

import { assert } from "@hyperion/global";
import { Channel } from "@hyperion/hook/src/Channel";
import { getFunctionInterceptor, interceptFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { getVirtualPropertyValue, setVirtualPropertyValue } from "@hyperion/hyperion-core/src/intercept";
import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
import { TriggerFlowlet, getTriggerFlowlet, setTriggerFlowlet } from "@hyperion/hyperion-flowlet/src/TriggerFlowlet";
import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import { ALFlowletManager, IALFlowlet } from "./ALFlowletManager";
import { isTrackedEvent } from "./ALInteractableDOMElement";
import { ALChannelSurfaceEvent } from "./ALSurface";
import { ALSurfaceContext, ALSurfaceContextFilledValue, useALSurfaceContext } from "./ALSurfaceContext";
import * as ALUIEventGroupPublishers from "./ALUIEventGroupPublisher";
import { ALChannelUIEvent } from "./ALUIEventPublisher";
import * as  Flowlet from "@hyperion/hyperion-flowlet/src/Flowlet";

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
    enableFlowletConstructorTracking?: boolean;
    enablePerSurfaceTracking?: boolean;
    enableReactCallbacksTracking?: boolean;
    enableReactMethodFlowlet?: boolean;
    enableReactSetStateTracking?: boolean;
  }
>;

let initialized = new TestAndSet();
export function init(options: InitOptions) {
  if (initialized.testAndSet()) {
    return;
  }

  const { channel, flowletManager } = options;

  let currTriggerFlowlet = new flowletManager.flowletCtor('pageload');
  currTriggerFlowlet.data.triggerFlowlet = currTriggerFlowlet;

  const activeRootFlowlets = new class {
    private _values = new Set<IALFlowlet>();
    add(flowlet: IALFlowlet): this {
      if (
        !flowlet.parent && // only care about root flowlets
        flowlet !== flowlet.data.triggerFlowlet // no need to add trigger flowlets themselves
      ) {
        this._values.add(flowlet);
        flowlet.data.triggerFlowlet ||= currTriggerFlowlet;
      }
      return this;
    }

    delete(flowlet: IALFlowlet): boolean {
      if (!flowlet.parent && flowlet.data.surface) {
        /**
         * Since all surfaces will have a common root, the following
         * should never happen. But, for the sake of resiliance, the
         * code will keep the top surface flowlets always alive.
         */
        return false;
      }
      return this._values.delete(flowlet);
    }

    values(): Set<IALFlowlet> {
      return this._values;
    }
  }();

  activeRootFlowlets.add(flowletManager.root);

  let setActiveTriggerFlowlet: (triggerFlowlet: TriggerFlowlet | null | undefined, surface: string | null) => void = (triggerFlowlet, _surface) => {
    if (!triggerFlowlet) {
      return; // nothing to do
    }

    // We don't know the actual surface (options are off!) update everything
    for (const root of activeRootFlowlets.values()) {
      root.data.triggerFlowlet = triggerFlowlet;
    }

    currTriggerFlowlet = triggerFlowlet;
  }
  setActiveTriggerFlowlet(currTriggerFlowlet, null);

  // Assign triggers to surface flowlets
  channel.addListener('al_ui_event_capture', event => {
    setActiveTriggerFlowlet(event.triggerFlowlet, event.surface);
  });

  const IS_TRIGGER_FLOWLET_SETUP_PROP = 'isTriggerFlowletSetup';
  IEventTarget.addEventListener.onArgsObserverAdd(function (this, eventType, _callback) {
    if (!ALUIEventGroupPublishers.isSupported(eventType)) {
      return;
    }

    if (!isTrackedEvent(eventType) && this instanceof Element && !getVirtualPropertyValue(this, IS_TRIGGER_FLOWLET_SETUP_PROP)) {
      setVirtualPropertyValue(this, IS_TRIGGER_FLOWLET_SETUP_PROP, true);
      /**
       * We could potentially intercept the callback itself and add the following
       * but that could add too much overhead to every callback.
       */
      // const topTriggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
      /**
       * Here we catch application code calling addEventListener to add a handler for an event.
       * We then want to do one extra event handler of our own, before every other handler the very first time such event handler is installed.
       * This handler ensures that the event has the right extended fields.
       * Here if we call the normal addEventListener, it will again bring us back to this very interception and we go into an infinite loop!
       * We do know that the goal of this callback is to update the triggerFlowlet and nothing else matters. So, we can bypass all of 
       * the other logic by calling the original function.
       */
      IEventTarget.addEventListener.getOriginal().call(
        this,
        eventType,
        event => {
          if (!getTriggerFlowlet(event)) {
            const parentTriggerFlowlet = ALUIEventGroupPublishers.getGroupRootFlowlet(event);
            const triggerFlowlet = new flowletManager.flowletCtor(
              `${eventType}(ts:${performanceAbsoluteNow()})`,
              parentTriggerFlowlet
            );
            setTriggerFlowlet(event, triggerFlowlet);
          }
        },
        true, // useCapture
      );
    }
  });

  // Temporarily disable this until we can re-enable react-flowlet logic below
  if (options.enablePerSurfaceTracking) {
    const ALSurfaceContextDataMap = new Map<ALSurfaceContextFilledValue['surface'], ALSurfaceContextFilledValue['flowlet']>();

    const interceptedSetter = interceptFunction(setActiveTriggerFlowlet);
    setActiveTriggerFlowlet = interceptedSetter.interceptor;
    interceptedSetter.onArgsObserverAdd((triggerFlowlet, surface) => {
      if (surface && triggerFlowlet) {
        // The following may not happen until react interception and flowlets actually are enabled.
        const surfaceFlowlet = ALSurfaceContextDataMap.get(surface);
        if (surfaceFlowlet) {
          surfaceFlowlet.data.triggerFlowlet = triggerFlowlet;
        }
      }
    });

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
  }

  if (options.enableFlowletConstructorTracking) {
    /**
     * To know if root of a flowlet is added to list, we would need
     * to walk up the .parent chain to find the root.
     * Since we know most of the flowlets will be created from the
     * FlowletManager.root, we use a the following trick:
     * We add a known field the root's data and check chat in children's
     * data (data fields inherit from each other).
     * If we don't find the field, we have two options:
     * 1- Now walk up the .parent chain (slow path)
     * 2- Consider this case error and fix it in the code.
     * For now, we choose 2 since there is no real legit case for a
     * 'rootless' flowlet!
     */
    //@ts-expect-error
    flowletManager.root.data.isRooted = true;

    // TODO: do we need to add every flowlet here or just Surface ones?
    Flowlet.onFlowletInit.add(flowlet => {
      //@ts-expect-error
      if (!flowlet.data.isRooted) {
        console.error('Unexpected unrooted flowlet: ', flowlet.getFullName());
      }

      if (!flowlet.parent) {
        activeRootFlowlets.add(flowlet);
      }
    });
  }

  /**
   * We wrapp the callback function of the following api to ensure they can
   * make a copy of the triggerFlowlet based on the semantics of the FlowletManager.wrap()
   * which means once they are called, they have a copy of this token and we can change the
   * activeRootFlowlets safely later.
   */
  const { IReactModule } = options.react;

  if (options.enableReactCallbacksTracking) {
    [
      IReactModule.useCallback,
    ].forEach(fi => {
      /**
       * useCallback will recieve a new callback function each time, but may return a previous
       * one. So, it might be more efficient to only focus on the return value.
       */
      // fi.onArgsMapperAdd(args => {
      //   args[0] = flowletManager.wrap(args[0], fi.name);
      //   return args;
      // });
      fi.onValueMapperAdd(value => {
        return flowletManager.wrap(value, fi.name);
      });

    });

    [
      IReactModule.useEffect,
      IReactModule.useLayoutEffect,
    ].forEach(fi => {
      fi.onArgsMapperAdd(args => {
        args[0] = flowletManager.wrap(args[0], fi.name);
        const setupInterceptor = getFunctionInterceptor(args[0]);
        if (setupInterceptor && !setupInterceptor.testAndSet(IS_TRIGGER_FLOWLET_SETUP_PROP)) {
          setupInterceptor.onValueMapperAdd(cleanup => {
            if (cleanup) {
              return flowletManager.wrap(cleanup, fi.name + `_cleanup`);
            } else {
              return cleanup;
            }
          });
        }
        return args;
      });
    });
  }

  if (options.enableReactSetStateTracking) {
    [
      IReactModule.useState,
      IReactModule.useReducer
    ].forEach(fi => {
      fi.onValueMapperAdd(value => {
        value[1] = flowletManager.wrap(value[1], fi.name);
        const setterInterceptor = getFunctionInterceptor(value[1]);
        if (setterInterceptor && !setterInterceptor.testAndSet(IS_TRIGGER_FLOWLET_SETUP_PROP)) {
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
            setActiveTriggerFlowlet(triggerFlowlet, null);
          });
        }
        return value;
      });
    });

    assert(options.react.enableInterceptClassComponentMethods, "Trigger Flowlet would need interception of class component methods");
    IReactComponent.onReactClassComponentIntercept.add(shadowComponent => {
      const setState = shadowComponent.setState;
      if (!setState.testAndSet(IS_TRIGGER_FLOWLET_SETUP_PROP)) {
        setState.onArgsObserverAdd(() => {
          const triggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
          setActiveTriggerFlowlet(triggerFlowlet, null);
        });
      }
    });
  }

  if (options.enableReactMethodFlowlet) {
    /**
    * The following interceptor methods (onArgsObserver/onValueObserver) run immediately
    * before & after intercepted method. So, we can push before and pop after so that
    * the body of the method has access to flowlet.
    * For class components, we store the flowlet in the `this` object.
    * For function components, we have to keep that value and close on it (we could use useRef)
    */

    const IS_FLOWLET_SETUP_PROP = 'isFlowletSetup';

    type FlowletRef = {
      _flowlet?: IALFlowlet | null | undefined
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
}


