/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
'use strict';

import { Flowlet } from "hyperion-flowlet/src/Flowlet";
import * as IReactFlowlet from "hyperion-react/src/IReactFlowlet";
import { ALFlowletDataType } from "./ALFlowletManager";


export class SurfacePropsExtension<
  DataType extends ALFlowletDataType,
  FlowletType extends Flowlet<DataType>> extends IReactFlowlet.PropsExtension<DataType, FlowletType>  {
  getSurface(): string | undefined {
    return this.callFlowlet?.data.surface;
  }
}
