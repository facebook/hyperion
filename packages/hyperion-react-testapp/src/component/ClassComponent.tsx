/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from "react";
import FuncComponent from "./FuncComponent";
import { Props, Surface } from "./Surface";
import { ALSurfaceContext } from "@hyperion/hyperion-autologging/src/ALSurfaceContext";
import { FlowletManager } from "../FlowletManager";

class ClassCompWithSurface extends React.Component<{}>{
  private foo() {
    const flowlet = FlowletManager.top();
    if (flowlet?.name !== "In Render") {
      console.error("Invalid flowlet in this method", flowlet?.getFullName());
    } else {
      console.log("Recieved correct flowlet", flowlet.getFullName());
    }
  }
  render(): React.ReactNode {
    if (ALSurfaceContext) {
      const outterFlowlet = FlowletManager.top();
      return <ALSurfaceContext.Consumer>
        {value => {
          const surface = value.surface;
          const surfaceFlowlet = value.flowlet;
          const flowlet = FlowletManager.top();
          const newFlowlet = FlowletManager.push(new FlowletManager.flowletCtor("In Render", surfaceFlowlet));
          const result = <table border={1} ><tbody>
            <tr><th>Surface</th><td>{surface}</td></tr>
            <tr><th>Surface Flowlet: </th><td>{surfaceFlowlet?.getFullName()}</td></tr>
            <tr><th>Inner Render Flowlet: </th><td>{flowlet?.getFullName()}</td></tr>
            <tr><th>Outter Render Flowlet: </th><td>{outterFlowlet?.getFullName()}</td></tr>
          </tbody></table>;
          this.foo();
          FlowletManager.pop(newFlowlet);
          return result;
        }
        }
      </ALSurfaceContext.Consumer>
    }
  }
}
export default class ClassComponent extends React.Component<Props> {
  render() {
    return Surface({ surface: `ClassComp: ${this.props.message}`, metadata: { type: 'class component' } })(
      <>
        <ul data-comptype="class">
          <li>The class component</li>
          <li>{this.props.message}</li>
          <li>
            <FuncComponent message="func comp inside class compo" />
            {this.props.children}
          </li>
        </ul>
        <ClassCompWithSurface></ClassCompWithSurface>
      </>,
    );
  }
}