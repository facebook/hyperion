/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import { ALFlowletManager, ALFlowletDataType } from "@hyperion/hyperion-autologging/src/ALFlowletManager";

interface FlowletDataType extends ALFlowletDataType {
  i?: number
}

export const FlowletManager = new ALFlowletManager<FlowletDataType>;

FlowletManager.push(new Flowlet("top"));
