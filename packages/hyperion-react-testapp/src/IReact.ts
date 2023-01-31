import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import * as IReactFlowlet from "@hyperion/hyperion-react/src/IReactFlowlet";
import * as IReactPropsExtension from "@hyperion/hyperion-react/src/IReactPropsExtension";
import React from 'react';
import ReactDev from "react/jsx-dev-runtime";
import * as Surface from "./component/Surface";
import { FlowletManager } from "./FlowletManager";

export let interceptionStatus = "disabled";
export function init() {

  interceptionStatus = "enabled";
  const IReactModule = IReact.intercept("react", React)
  const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-dev-runtime", ReactDev as any);

  IReactComponent.init({ IReactModule, IJsxRuntimeModule });

  IReactFlowlet.init({ IReactModule, IJsxRuntimeModule, flowletManager: FlowletManager });
  Surface.init({
    ReactModule: React,
    IReactModule,
    IJsxRuntimeModule,
    flowletManager: FlowletManager
  });


  let extId = 0;
  const extensionGetter = IReactPropsExtension.init({ IReactModule, IJsxRuntimeModule, extensionCtor: () => ({ id: extId++ }) });

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