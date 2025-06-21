/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */


import { Flowlet } from "hyperion-flowlet/src/Flowlet";

export interface FlowletDataType {
  // Technically anyone else can extend this interface for their expected data
};


export class PropsExtension<
  DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>
> {
  callFlowlet: FlowletType;

  constructor(callFlowlet: FlowletType) {
    this.callFlowlet = callFlowlet;
  }

  toString(): string {
    return this.callFlowlet.getFullName();
  }
}
