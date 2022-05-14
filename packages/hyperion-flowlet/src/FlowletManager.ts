/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { Hook } from "@hyperion/hook";
import { Flowlet } from "./Flowlet";

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
    __DEV__ && assert(!flowlet || currTop === flowlet, `Incompatible top of the stack: expected({${flowlet?.name}}), actual({${currTop?.name}})`);
    this.flowletStack.pop();
    this.onPop.call(currTop, reason);
    return currTop;
  }
  readonly onPop = new Hook<(flowlet: T | null, reason?: string) => void>();
}