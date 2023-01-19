import { intercept, interceptRuntime } from "@hyperion/hyperion-react/src/IReact";
// import { createReactNodeVisitor } from "@hyperion/hyperion-react/src/IReactElementVisitor";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import React from 'react';
import ReactDev from "react/jsx-dev-runtime";

export let interceptionStatus = "disabled";
export function init() {

  interceptionStatus = "enabled";
  const IReact = intercept(React)
  const IReactRuntime = interceptRuntime(ReactDev as any);
  IReactComponent.init(IReact, IReactRuntime)

  let funcCount = 0;
  IReactComponent.onReactFunctionComponentElement.add(component => {
    funcCount++;
    // console.log(component);
  });

  // IReactRuntime.jsxDEV.onArgsObserverAdd((type, props, children) => {
  //   console.log(type);
  // })

}