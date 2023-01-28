import React from "react";
import * as ALSurface from "@hyperion/hyperion-autologging/src/Surface";
import { FlowletManager } from "../FlowletManager";
import * as IReact from "@hyperion/hyperion-react/src/IReact";

export type Props = {
  message: string,
  children?: React.ReactNode,
};

let SurfaceRenderer: ALSurface.ALSurfaceHOC = (props, render) => {
  return children => render ? render(children) : <>children</>;
}

export const Surface = (props: ALSurface.ALSurfaceProps) =>
  SurfaceRenderer(props, children => (
    <div style={{ border: '1px solid red', marginLeft: '5px' }}>
      <div style={{ color: 'red' }}>{props.surface}</div>
      {children}
    </div>
  ));

export function init(
  IReactModule: IReact.IReactModuleExports,
  IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports
) {
  SurfaceRenderer = ALSurface.init({
    ReactModule: React,
    IReactModule,
    IJsxRuntimeModule,
    flowletManager: FlowletManager
  });
}
