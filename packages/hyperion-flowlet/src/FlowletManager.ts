/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";
import { InterceptableFunction, getFunctionInterceptor, interceptFunction } from "@hyperion/hyperion-core/src/FunctionInterceptor";
import { CallbackType, interceptEventListener, isEventListenerObject } from "@hyperion/hyperion-dom/src/IEventListener";
import { Flowlet } from "./Flowlet";
import { assert, getLogger } from "@hyperion/global";
import { TimedTrigger } from "@hyperion/hyperion-util/src/TimedTrigger";

const IS_FLOWLET_SETUP_PROP_NAME = `__isFlowletSetup`;

const CLEANUP_PERIOD = 3000; // ms call cleanup at most every 3 seconds
const MIN_STACK_SIZE_TO_SCHEDULE_CLEANUP = 100; // only if stack size passes this number schedule a later cleanup
const MIN_STACK_SIZE_FOR_QUICK_CLEANUP = 10; // clean up pending tasks if system was not idle and stack size is greater than this value


export class FlowletManager<T extends Flowlet = Flowlet> {
  private _flowletStack: T[] = [];
  private _top: T | null = null; // To optimize for faster reading of top;

  /**
   * If we don't succeed at poping the top of stack, we keep a list of those
   * iterms and periodically remove them to ensure the size of the stack does
   * not keep growing.
   */
  private _pendingPops = new Set<T>();

  private _scheduler: TimedTrigger | null = null;

  public readonly root: T;
  constructor(public flowletCtor: new (flowletName: string, parent?: T | null) => T) {
    this.root = new flowletCtor("");

    if (__DEV__) {
      this.onPush.add(flowlet => {
        assert(flowlet != null, `Unexpected NULL flowlet value pushed to stack!`);
      });
    }
    this.scheduleCleanup();
  }

  private scheduleCleanup() {
    /**
     * We schdule a listner to see when stack reaches the threshold size.
     * Then we don't need to have this listener any more until cleanup is finished, at which
     * point we can schedule the stack size monitoring again.
     * This should save some cycles during busy times.
     */
    const handler = this.onPush.add(() => {
      if (this.stackSize() > MIN_STACK_SIZE_TO_SCHEDULE_CLEANUP && !this._scheduler) {
        this.onPush.remove(handler); // No longer need this code until cleanup finishes.
        this._scheduler = new TimedTrigger(
          (timerFired) => {
            this._scheduler = null;
            const fullCleanup = !timerFired; // We are in the idle period and should have nothing on the stack
            this.cleanup(fullCleanup);
            this.scheduleCleanup();
          },
          CLEANUP_PERIOD,
          true // use idle callback when possible.
        );
      }
    });
  }

  public cleanup(fullCleanup: boolean) {
    if (fullCleanup) {
      // We are in the idle period and should have nothing on the stack
      if (this.stackSize() > 0) {
        getLogger().warn?.(`Flushed all pending flowlets from stack of size: `, this.stackSize());
        this._flowletStack = [];
      }
    } else {
      if (this.stackSize() > MIN_STACK_SIZE_FOR_QUICK_CLEANUP && this._pendingPops.size > 0) {
        this.popIf(flowlet => this._pendingPops.has(flowlet));
        this._pendingPops.clear();
      }
    }
  }

  top(): T {
    return this._top ?? this.root;
  }

  private updateTop() {
    const last = this._flowletStack.length - 1;
    this._top = last >= 0 ? this._flowletStack[last] : null;
  }

  stackSize(): number {
    return this._flowletStack.length;
  }

  push(flowlet: T, forkReason?: string): T {
    const newFlowlet = forkReason && this.flowletCtor ? new this.flowletCtor(forkReason, flowlet) : flowlet;
    this.onPush.call(flowlet, forkReason, newFlowlet);
    this._flowletStack.push(newFlowlet);
    this.updateTop();
    return newFlowlet;
  }
  readonly onPush = new Hook<(flowlet: T, reason?: string, replacementFlowlet?: T) => void>();

  /**
  * Pops all the flowlets that match a certain filter condition
  * @param filter : function to select which flowlets to be popped
  */
  popIf(filter: (flowlet: T) => boolean) {
    this._flowletStack = this._flowletStack.filter(filter);
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
    let succeeded: boolean;
    if (currTop === flowlet) {
      this._flowletStack.pop();
      this.updateTop();
      succeeded = true;
    } else {
      succeeded = false;
      this._pendingPops.add(flowlet);
    }
    this.onPop.call(flowlet, succeeded, reason);
    return currTop;
  }
  readonly onPop = new Hook<(flowlet: T | null, popSucceeded: boolean, reason: string | undefined) => void>();

  wrap<C extends CallbackType | undefined | null>(
    listener: C,
    apiName: string,
    customFlowlet?: T,
    getTriggerFlowlet?: (...args: any) => T | null | undefined
  ): C {
    if (!listener) {
      return listener;
    }

    const funcInterceptor = interceptEventListener(listener);
    if (funcInterceptor && !funcInterceptor.testAndSet(IS_FLOWLET_SETUP_PROP_NAME)) {

      const flowlet = customFlowlet ?? new this.flowletCtor(apiName, this.top());
      if (!getTriggerFlowlet) {
        /**
         * we are not going to pickup an actual trigger later, which means whatever triggered
         * the current code that is passing the callback, is the trigger inside of that callback
         * going forward. So, we make a copy of it case the original trigger is replaced with a new one
         */
        const currTriggerFlowlet = flowlet.parent?.data.triggerFlowlet;
        if (currTriggerFlowlet) {
          flowlet.data.triggerFlowlet = currTriggerFlowlet;
        }
      }

      const flowletManager = this;

      // Should we use onArgsAndValueMapper instead of setCustom, although this is safer with the finally call.
      funcInterceptor.setCustom(<any>function (this: any) {
        const handler: Function = funcInterceptor.getOriginal();
        const triggerFlowlet = getTriggerFlowlet?.apply(this, <any>arguments);
        if (triggerFlowlet) {
          flowlet.data.triggerFlowlet = triggerFlowlet;
        } else {
          // Lets delete the existing value to enaure we don't carry it from the previous invocation
          delete flowlet.data.triggerFlowlet;
        }

        if (flowletManager.top() === flowlet) {
          /**
           * We would mostly expect the currentFLowlet to be on the top most of the time
           * but we do this check here just in case we can save extra push/pop
           */
          return handler.apply(this, <any>arguments);
        }
        let res;
        try {
          flowletManager.push(flowlet); // let's not pass apiName to avoid creating a new flowlet each time.
          res = handler.apply(this, <any>arguments);
        } finally {
          flowletManager.pop(flowlet, apiName);
        }
        return res;
      });
    }
    return isEventListenerObject(listener) || !funcInterceptor ? listener : <C>funcInterceptor.interceptor;
  }

  /**
   * In case we wanted a function to push/pop a flowlet name on the stack, we can
   * use this helper function to create a wrapper that marks the desired flowlet
   * @param listener
   * @param getFlowletName
   * @returns
   */
  mark<F extends InterceptableFunction | undefined | null>(
    func: F,
    getFlowletName: (...args: any) => string,
  ): F {
    if (!func) {
      return func;
    }

    const funcInterceptor = interceptFunction(func);
    if (funcInterceptor && !funcInterceptor.testAndSet(IS_FLOWLET_SETUP_PROP_NAME)) {

      const flowletManager = this;

      // Should we use onArgsAndValueMapper instead of setCustom, although this is safer with the finally call.
      funcInterceptor.setCustom(<any>function (this: any) {
        const handler: Function = funcInterceptor.getOriginal();
        const flowletName = getFlowletName.apply(this, <any>arguments);
        const flowlet = new flowletManager.flowletCtor(flowletName, flowletManager.top());
        let res;
        try {
          flowletManager.push(flowlet);
          res = handler.apply(this, <any>arguments);
        } finally {
          flowletManager.pop(flowlet);
        }
        return res;
      });
    }
    return <F>funcInterceptor.interceptor;
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
