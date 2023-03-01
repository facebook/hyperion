/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { FlowletManager as BaseFlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";



/**
 * We want to allow type of flowlet to be passed here. the only thing we need
 * from the data type is the `surface` field. Sonce, ALFlowlet may change
 * overtime, we don't want to create an uncessary dependency on that.
 */
export interface ALFlowletDataType {
  surface?: string,
};

export class ALFlowlet<DataType extends ALFlowletDataType = ALFlowletDataType>
  extends Flowlet<DataType>{
}

export class ALFlowletManager<DataType extends ALFlowletDataType = ALFlowletDataType>
  extends BaseFlowletManager<ALFlowlet<DataType>>{
  constructor() {
    super(ALFlowlet);
  }
}
