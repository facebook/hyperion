import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactPropsExtension from "@hyperion/hyperion-react/src/IReactPropsExtension";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import * as IReactFlowlet from "@hyperion/hyperion-react/src/IReactFlowlet";
import React from 'react';
import ReactDev from "react/jsx-dev-runtime";
import { FlowletManager } from "./FlowletManager";
import * as  Surface from "./component/Surface";
import * as ReactDOM from "react-dom";
import * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";

export let interceptionStatus = "disabled";
export function init() {

  interceptionStatus = "enabled";
  const IReactModule = IReact.intercept("react", React, [])
  const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-dev-runtime", ReactDev as any, []);
  const IReactDOMModule = IReactDOM.intercept("react-dom", ReactDOM, []);

  IReactComponent.init({ IReactModule, IJsxRuntimeModule });

  IReactFlowlet.init({ IReactModule, IJsxRuntimeModule, flowletManager: FlowletManager });
  Surface.init({
    ReactModule: React,
    IReactDOMModule,
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
  IReactDOMModule.createPortal.onArgsObserverAdd((_node, container) => {
    console.log('XXX creating portal for node', container);
  })
  // IReactRuntime.jsxDEV.onArgsObserverAdd((type, props, children) => {
  //   console.log(type);
  // })

}