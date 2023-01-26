import { intercept, interceptRuntime } from "@hyperion/hyperion-react/src/IReact";
import * as IReactPropsExtension from "@hyperion/hyperion-react/src/IReactPropsExtension";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import React from 'react';
import ReactDev from "react/jsx-dev-runtime";

export let interceptionStatus = "disabled";
export function init() {

  interceptionStatus = "enabled";
  const IReact = intercept(React)
  const IReactRuntime = interceptRuntime(ReactDev as any);
  IReactComponent.init(IReact, IReactRuntime)

  let extId = 0;
  const extensionGetter = IReactPropsExtension.init(IReact, IReactRuntime, () => ({ id: extId++ }));

  IReactComponent.onReactFunctionComponentElement.add((component, props) => {
    console.log('func comp', component.displayName, extensionGetter(props));
  });

  IReactComponent.onReactClassComponentElement.add((component, props) => {
    console.log('class comp', component.name, extensionGetter(props));
  });

  IReactComponent.onReactDOMElement.add(component => {
    console.log('dom comp', component);
  });

  IReactComponent.onReactSpecialObjectElement.add(component => {
    console.log('special comp', component);
  });

  IReactComponent.onReactFunctionComponentIntercept.add(component => {
    console.log('func comp intercept', component);
  });

  IReactComponent.onReactClassComponentIntercept.add(component => {
    console.log('class comp intercept', component);
  });

  // IReactRuntime.jsxDEV.onArgsObserverAdd((type, props, children) => {
  //   console.log(type);
  // })

}