/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";
import { getFunctionInterceptor } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { CallbackType, interceptEventListener, isEventListenerObject } from "@hyperion/hyperion-dom/src/IEventListener";
import { Flowlet } from "./Flowlet";


const IS_FLOWLET_SETUP_PROP_NAME = `__isFlowletSetup`;

export class FlowletManager<T extends Flowlet = Flowlet> {
  private flowletStack: T[] = [];
  private _top: T | null = null; // To optimize for faster reading of top;

  constructor(public flowletCtor?: new (flowletName: string, parent?: T) => T) { }

  top(): T | null {
    return this._top;
  }

  private updateTop() {
    const last = this.flowletStack.length - 1;
    this._top = last >= 0 ? this.flowletStack[last] : null;
  }

  push(flowlet: T, forkReason?: string): T {
    const newFlowlet = forkReason && this.flowletCtor ? new this.flowletCtor(forkReason, flowlet) : flowlet;
    this.onPush.call(flowlet, forkReason);
    this.flowletStack.push(newFlowlet);
    this.updateTop();
    return newFlowlet;
  }
  readonly onPush = new Hook<(flowlet: T, reason?: string) => void>();

  /**
  * Pops all the flowlets that match a certain filter condition
  * @param filter : function to select which flowlets to be popped
  */
  popIf(filter: (flowlet: T) => boolean) {
    this.flowletStack = this.flowletStack.filter(filter);
    this.updateTop();
  }

  /**
   * pop and return top of stack
   * @param flowlet if passed, asserts top matches the input
   * @returns top of the stack or null
   */
  pop(flowlet?: T, reason?: string): T | null {
    let currTop = this.top();
    if (!flowlet) {
      return currTop;
    }
    // __DEV__ && assert(!!flowlet, `Cannot pop undefined flowlet from top of the stack: ${currTop?.fullName()}`);
    if (currTop === flowlet) {
      this.flowletStack.pop();
      this.updateTop();
    } else {
      this.popIf(f => f !== flowlet);
    }
    this.onPop.call(flowlet, reason);
    return currTop;
  }
  readonly onPop = new Hook<(flowlet: T | null, reason?: string) => void>();


  wrap<T extends CallbackType | undefined | null>(listener: T, apiName: string): T {
    if (!listener) {
      return listener;
    }

    const currentFLowlet = this.top();
    if (!currentFLowlet) {
      return listener;
    }

    const funcInterceptor = interceptEventListener(listener);
    if (funcInterceptor && !funcInterceptor.getData(IS_FLOWLET_SETUP_PROP_NAME)) {
      funcInterceptor.setData(IS_FLOWLET_SETUP_PROP_NAME, true);
      // funcInterceptor.onArgsObserverAdd(() => {
      //   this.push(currentFLowlet);
      // });
      // funcInterceptor.onValueObserverAdd(() => {
      //   this.pop(currentFLowlet);
      // })
      const flowletManager = this;
      funcInterceptor.setCustom(function (this: any) {
        const handler: Function = funcInterceptor.getOriginal();
        if (flowletManager.top() === currentFLowlet) {
          return handler.apply(this, <any>arguments);
        }
        let res;
        let flowlet; // using this extra variable to enable .push to change the value if needed
        try {
          flowlet = flowletManager.push(currentFLowlet, apiName);
          res = handler.apply(this, <any>arguments);
        } finally {
          flowletManager.pop(flowlet, apiName);
        }
        return res;
      });
    }
    return isEventListenerObject(listener) || !funcInterceptor ? listener : <T>funcInterceptor.interceptor;
  }

  getWrappedOrOriginal<T extends CallbackType | undefined | null>(listener: T): T {
    /**
     * During wrapping, we replace a function with its intercepted version, which they might be passed
     * to other api (such as browser api). In all other cases, wrapping returns the same original listener
     *
     * When we try to call the reverse an api (e.g. removeEventListener after calling addEventListener), application
     * may pass the original listener again, and we need to ensure the wrapped version is sent back.
     */
    if (listener && !isEventListenerObject(listener)) {
      const funcInterceptor = getFunctionInterceptor(listener);
      if (funcInterceptor) {
        return <T>funcInterceptor.interceptor;
      }
    }
    return listener;
  }
}