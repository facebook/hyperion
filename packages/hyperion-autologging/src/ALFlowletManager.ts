/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { FlowletManager as BaseFlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import { Flowlet, FlowletDataType } from "@hyperion/hyperion-flowlet/src/Flowlet";



/**
 * We want to allow type of flowlet to be passed here. the only thing we need
 * from the data type is the `surface` field. Sonce, ALFlowlet may change
 * overtime, we don't want to create an uncessary dependency on that.
 */
export interface ALFlowletDataType extends FlowletDataType {
  surface?: string;
  uiEventFlowlet?: IALFlowlet;
  triggerFlowlet?: IALFlowlet;
};

export interface IALFlowlet<DataType extends ALFlowletDataType = ALFlowletDataType> extends Flowlet<DataType> { }

interface FlowletJSON {
  id: number;
  name: string;
}

export interface ALFlowletJSON extends FlowletJSON {
  data: {
    surface?: string;
    uiEventFlowlet: FlowletJSON | null | undefined;
    triggerFlowlet: FlowletJSON | null | undefined;
  },
};

function flowletToJSON(flowlet: Flowlet): FlowletJSON {
  return { id: flowlet.id, name: flowlet.getFullName() };
}


export class ALFlowlet<DataType extends ALFlowletDataType = ALFlowletDataType>
  extends Flowlet<DataType>
  implements IALFlowlet<DataType>
{

  toJSON(): ALFlowletJSON {
    return {
      ...flowletToJSON(this),
      data: {
        surface: this.data.surface,
        uiEventFlowlet: this.data.uiEventFlowlet && flowletToJSON(this.data.uiEventFlowlet),
        triggerFlowlet: this.data.triggerFlowlet && flowletToJSON(this.data.triggerFlowlet),
      },
    };
  }

}

export class ALFlowletManager<DataType extends ALFlowletDataType = ALFlowletDataType>
  extends BaseFlowletManager<IALFlowlet<DataType>>{
  constructor() {
    super(ALFlowlet);
  }
}
