/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IReact from "hyperion-react/src/IReact";
import * as IReactComponent from "hyperion-react/src/IReactComponent";
import ReactDev from "react/jsx-runtime";
import React from "react";
import * as IPromise from "hyperion-core/src/IPromise";

globalThis.__DEV__ = true;

export let interceptionStatus = "disabled";

export function init() {
  console.log('Running AL init!');

  // ReactModule/JSX
  const IReactModule = IReact.intercept("react", React as any, []);
  const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-runtime", ReactDev as any, []);

  /**
  * *****************************
  * IReactComponent / JSX - END
  * *****************************
  */
  IReactComponent.init({
    ReactModule: React as any,
    IReactModule,
    IJsxRuntimeModule: IJsxRuntimeModule as any,
    enableInterceptClassComponentConstructor: true,
    enableInterceptClassComponentMethods: true,
    enableInterceptFunctionComponentRender: true,
    enableInterceptDomElement: true,
    enableInterceptComponentElement: true,
    enableInterceptSpecialElement: true,
  });


  IReactComponent.onReactClassComponentElement.add((component, props) => {
    console.log("IReactComponent [React] onReactClassComponentElement", component.name || component.displayName, props);
  });
  IReactComponent.onReactFunctionComponentElement.add((component, props) => {
    console.log("IReactComponent [Func] onReactFunctionComponentElement", component.name || component.displayName, props);
  });
  IReactComponent.onReactDOMElement.add((element, props) => {
    console.log("IReactComponent [DOM] onReactDOMElement", element, props);
  });

  // IJsxRuntimeModule?.jsxDEV.onBeforeCallObserverAdd((jsxDEV, ...args) => {
  //   console.log('jsxDEV:', jsxDEV, args);
  // });
  // IJsxRuntimeModule?.jsx.onBeforeCallObserverAdd((jsx, ...args) => {
  //   console.log('jsx:', jsx, args);
  // });
  // IJsxRuntimeModule?.jsxs.onBeforeCallObserverAdd((jsxs, ...args) => {
  //   console.log('jsxs:', jsxs, args);
  // });

  /**
   * *****************************
   * IReactComponent / JSX - END
   * *****************************
   */

  // Add Promise interception for debugging
  function observer(name: string) {
    return function <T, V>(this: T, value: V) {
      console.log(name, value);
    }
  }

  IPromise.resolve.onBeforeCallObserverAdd(observer('IPromise.resolve'));
  IPromise.reject.onBeforeCallObserverAdd(observer('IPromise.reject'));
  IPromise.all.onBeforeCallObserverAdd(observer('IPromise.all'));

  // return;
  // Flags.setFlags({
  //   preciseTriggerFlowlet: true,
  //   optimizeInteractibiltyCheck: true,
  // });

  // return;

  // interceptionStatus = "enabled";
  // const flowletManager = FlowletManager;
  // console.log('Intercept react');
  // //                                           types incompatible
  // const IReactModule = IReact.intercept("react", React as any, []);
  // console.log('Intercept jsx');
  // const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-dev-runtime", ReactDev as any, []);
  // //
  // console.log('Intercept reactDOM');
  // const IReactDOMModule = IReactDOM.intercept("react-dom", ReactDOM as any, []);

  // const channel = SyncChannel;
  // console.log('Intercept react');
  // return;
  // Visualizer.init({
  //   flowletManager,
  //   channel,
  // });

  // channel.on("test").add((i, s) => { // Showing channel can be extend beyond expected types

  // });

  // console.log('Subscribe to events!')
  // channel.on('al_ui_event').add(ev => {
  //   console.log(ev);
  // });


  // const testCompValidator = (name: string) => !name.match(/(^Surface(Proxy)?)/);

  // console.log('csid:', ClientSessionID);
  // console.log('dsid', getDomainSessionID('localhost'));
  // console.log('dsid', getDomainSessionID());

  // // Better to first setup listeners before initializing AutoLogging so we don't miss any events (e.g. Heartbeat(START))



  // interface ExtendedElementText extends ALElementText {
  //   isExtended?: boolean;
  // }

  // AutoLogging.init({
  //   flowletManager,
  //   channel,
  //   // plugins: [
  //   //   PluginEventHash.init
  //   // ],
  //   componentNameValidator: testCompValidator,
  //   flowletPublisher: {
  //     channel
  //   },
  //   triggerFlowlet: {
  //     enableReactMethodFlowlet: false,
  //     enableFlowletConstructorTracking: false,
  //   },
  //   react: {
  //     ReactModule: React as any,
  //     IReactDOMModule,
  //     IReactModule,
  //     IJsxRuntimeModule,
  //   },
  //   surface: {
  //     enableReactDomPropsExtension: false,
  //   },
  //   sessionFlowID: {
  //     domain: 'localhost',
  //     cookieName: 'axaxax',
  //   },
  //   elementText: {
  //     updateText(elementText: ExtendedElementText, domSource) {
  //       elementText.isExtended = true;
  //       // console.log("Element Text ", elementText, domSource);
  //     },
  //   },
  //   uiEventPublisher: {
  //     uiEvents: [
  //       {
  //         eventName: 'click',
  //         cacheElementReactInfo: true,
  //         enableElementTextExtraction: true,
  //         eventFilter: (domEvent) => domEvent.isTrusted
  //       },
  //       {
  //         eventName: 'mousedown',
  //         cacheElementReactInfo: true,
  //         enableElementTextExtraction: false,
  //         eventFilter: (domEvent) => domEvent.isTrusted
  //       },
  //       {
  //         eventName: 'keydown',
  //         cacheElementReactInfo: true,
  //         interactableElementsOnly: false,
  //         enableElementTextExtraction: false,
  //         eventFilter: (domEvent) => domEvent.code === 'Enter',
  //       },
  //       {
  //         eventName: 'keyup',
  //         cacheElementReactInfo: true,
  //         interactableElementsOnly: false,
  //         enableElementTextExtraction: false,
  //         eventFilter: (domEvent) => domEvent.code === 'Enter',
  //       },
  //       {
  //         eventName: 'change',
  //         cacheElementReactInfo: true,
  //         enableElementTextExtraction: true,
  //         interactableElementsOnly: false,
  //       },
  //       // {
  //       //   eventName: 'mouseover',
  //       //   cacheElementReactInfo: true,
  //       //   interactableElementsOnly: false,
  //       //   enableElementTextExtraction: true,
  //       //   durationThresholdToEmitHoverEvent: 1000,
  //       // },
  //     ]
  //   },
  //   heartbeat: {
  //     heartbeatInterval: 30 * 1000
  //   },
  //   surfaceMutationPublisher: {
  //     cacheElementReactInfo: true,
  //     enableElementTextExtraction: false,
  //   },
  //   surfaceVisibilityPublisher: {},
  //   network: {
  //     requestFilter: request => !/robots/.test(request.url.toString()),
  //     requestUrlMarker: (request, params) => {
  //       // const flowlet = FlowletManager.top();
  //       // if (flowlet) {
  //       //   params.set('flowlet', flowlet.getFullName());
  //       // }
  //     }
  //   },
  //   domSnapshotPublisher: {
  //     eventConfig: [
  //       'al_ui_event',
  //       'al_surface_visibility_event'
  //     ]
  //   }
  // });

  // console.log('AutoLogging.init options:', AutoLogging.getInitOptions());
  // // console.log('dsid', getDomainSessionID('localhost'));
  // // console.log('dsid', getDomainSessionID());
  // console.log('sfid', getSessionFlowID());

}
