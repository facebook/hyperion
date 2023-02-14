/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
 'use strict';

import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import { FlowletManager } from "@hyperion/hyperion-flowlet/src/FlowletManager";
import * as IReactPropsExtension from "@hyperion/hyperion-react/src/IReactPropsExtension";
import * as IReactFlowlet from "@hyperion/hyperion-react/src/IReactFlowlet";

/**
 * We want to allow type of flowlet to be passed here. the only thing we need
 * from the data type is the `surface` field. Sonce, ALFlowlet may change
 * overtime, we don't want to create an uncessary dependency on that.
 */
export interface FlowletDataType extends IReactFlowlet.FlowletDataType {
  surface?: string,
};

export type SurfaceComponent<DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>,
  FlowletManagerType extends FlowletManager<FlowletType>> = (props: IReactPropsExtension.ExtendedProps<SurfacePropsExtension<DataType, FlowletType>> & {
    flowlet: FlowletType,
    flowletManager: FlowletManagerType,
    /** The incoming surface that we are re-wrapping via a proxy.
     * If this is provided,  then we won't emit mutations for this surface as we are
     * doubly wrapping that surface, for surface attribution purposes.
     */
    fullSurfaceString?: string
  }
  ) => React.ReactElement;



export class SurfacePropsExtension<DataType extends FlowletDataType,
  FlowletType extends Flowlet<DataType>> extends IReactFlowlet.PropsExtension<DataType, FlowletType>  {
  getSurface(): string | undefined {
    return this.flowlet?.data.surface;
  }
}
