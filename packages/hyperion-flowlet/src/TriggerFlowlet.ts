/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Flowlet, FlowletDataType } from "./Flowlet";

interface TriggerFlowletPayload extends Object {
  __ext_triggerFlowlet?: TriggerFlowlet
}

export class TriggerFlowlet extends Flowlet<FlowletDataType> {
  constructor(
    name: string,
    parent?: Flowlet | null
  ) {
    super(name, parent);
    this.data.triggerFlowlet = this; // Ensure this flowlet report itself as the trigger.
  }


}

export function setTriggerFlowlet(obj: TriggerFlowletPayload, triggerFlowlet: TriggerFlowlet): void {
  obj.__ext_triggerFlowlet = triggerFlowlet;
}

export function getTriggerFlowlet(obj: TriggerFlowletPayload): TriggerFlowlet | null | undefined {
  return obj.__ext_triggerFlowlet;
}