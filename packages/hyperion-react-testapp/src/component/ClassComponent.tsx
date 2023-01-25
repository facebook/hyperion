import React from "react";
import FuncComponent from "./FuncComponent";
import { Props, Surface } from "./Surface";

export default class ClassComponent extends React.Component<Props> {
  render() {
    return Surface({ surface: `ClassComp: ${this.props.message}` })(
      <ul data-comptype="class">
        <li>The class component</li>
        <li>{this.props.message}</li>
        <li>
          <FuncComponent message="func comp inside class compo" />
          {this.props.children}
        </li>
      </ul>,
    );
  }
}