/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
 'use strict';

import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import * as IReactPropsExtension from "@hyperion/hyperion-react/src/IReactPropsExtension";
import * as IReactFlowlet from "@hyperion/hyperion-react/src/IReactFlowlet";
import { ALFlowletDataType } from "./ALFlowletManager";


export type SurfaceComponent<
  DataType extends ALFlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>> = (props: IReactPropsExtension.ExtendedProps<SurfacePropsExtension<DataType, FlowletType>> & {
    flowlet: FlowletType,
    flowletManager: FlowletManagerType,
    fullSurfaceString?: string
  }
  ) => React.ReactElement;



export class SurfacePropsExtension<
  DataType extends ALFlowletDataType,
  FlowletType extends Flowlet<DataType>> extends IReactFlowlet.PropsExtension<DataType, FlowletType>  {
  getSurface(): string | undefined {
    return this.flowlet?.data.surface;
  }
}
