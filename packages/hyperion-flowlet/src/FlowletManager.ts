/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { isIntercepted } from "@hyperion/hyperion-core/src/intercept";
import { CallbackType, interceptEventListener, isEventListenerObject } from "@hyperion/hyperion-dom/src/IEventListener";
import { Flowlet } from "./Flowlet";


const IS_SETUP_PROP_NAME = `__isSetup`;

export class FlowletManager<T extends Flowlet = Flowlet> {
  private flowletStack: T[] = [];

  top(): T | null {
    const last = this.flowletStack.length - 1;
    return last >= 0 ? this.flowletStack[last] : null;
  }

  push(flowlet: T, reason?: string): T {
    this.onPush.call(flowlet, reason);
    this.flowletStack.push(flowlet);
    return flowlet;
  }
  readonly onPush = new Hook<(flowlet: T, reason?: string) => void>();

  /**
   * pop and return top of stack
   * @param flowlet if passed, asserts top matches the input
   * @returns top of the stack or null
   */
  pop(flowlet?: T, reason?: string): T | null {
    let currTop = this.top();
    // __DEV__ && assert(!flowlet || currTop === flowlet, `Incompatible top of the stack: expected({${flowlet?.name}}), actual({${currTop?.name}})`);
    __DEV__ && assert(!!flowlet, `Cannot pop undefined flowlet from top of the stack: ${currTop?.fullName()}`);
    if (currTop === flowlet) {
      this.flowletStack.pop();
    } else {
      this.flowletStack = this.flowletStack.filter(f => f !== flowlet);
    }
    this.onPop.call(currTop, reason);
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
    if (!funcInterceptor[IS_SETUP_PROP_NAME]) {
      funcInterceptor[IS_SETUP_PROP_NAME] = true;
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
        } catch (e) {
          console.error('callback throw', e);
        } finally {
          flowletManager.pop(flowlet, apiName);
        }
        return res;
      });
    }
    return isEventListenerObject(listener) ? listener : <T>funcInterceptor.interceptor;
  }

  unwrap<T extends CallbackType | undefined | null>(listener: T): T {
    if (listener && !isEventListenerObject(listener) && isIntercepted(listener)) {
      const funcInterceptor = interceptEventListener(listener);
      return <T>funcInterceptor.getOriginal();
    }
    return listener;
  }
}