/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as Visualizer from "@hyperion/hyperion-autologging-visualizer/src/index";
import { ALElementText } from "@hyperion/hyperion-autologging/src/ALInteractableDOMElement";
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";
import { ClientSessionID } from "@hyperion/hyperion-util/src/ClientSessionID";
import React from 'react';
import * as ReactDOM from "react-dom";
import ReactDev from "react/jsx-dev-runtime";
import { SyncChannel } from "./Channel";
import { FlowletManager } from "./FlowletManager";

export let interceptionStatus = "disabled";

export function init() {
  interceptionStatus = "enabled";
  const domSurfaceAttributeName = 'data-surfaceid';
  const flowletManager = FlowletManager;

  const IReactModule = IReact.intercept("react", React, [])
  const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-dev-runtime", ReactDev as any, []);
  const IReactDOMModule = IReactDOM.intercept("react-dom", ReactDOM, []);

  const channel = SyncChannel;

  Visualizer.init({
    flowletManager,
    domSurfaceAttributeName,
    channel,
  });

  channel.on("test").add((i, s) => { // Showing channel can be extend beyond expected types

  });


  const testCompValidator = (name: string) => !name.match(/(^Surface(Proxy)?)/);

  console.log('csid:', ClientSessionID);

  // Better to first setup listeners before initializing AutoLogging so we don't miss any events (e.g. Heartbeat(START))

  interface ExtendedElementText extends ALElementText {
    isExtended?: boolean;
  }

  const enableReactFlowlet = false;
  AutoLogging.init({
    flowletManager,
    domSurfaceAttributeName,
    componentNameValidator: testCompValidator,
    flowletPublisher: {
      channel
    },
    triggerFlowlet: {
      disableReactFlowlet: !enableReactFlowlet,
      channel,
    },
    react: {
      ReactModule: React as any,
      IReactDOMModule,
      IReactModule,
      IJsxRuntimeModule,
      enableInterceptClassComponentMethods: true,
      enableInterceptClassComponentConstructor: enableReactFlowlet,
      enableInterceptFunctionComponentRender: enableReactFlowlet,
    },
    surface: {
      channel,
      disableReactDomPropsExtension: true,
    },
    elementText: {
      updateText(elementText: ExtendedElementText, domSource) {
        elementText.isExtended = true;
        // console.log("Element Text ", elementText, domSource);
      },
    },
    uiEventPublisher: {
      channel,
      uiEvents: [
        {
          eventName: 'click',
          cacheElementReactInfo: true,
          eventFilter: (domEvent) => domEvent.isTrusted
        },
        {
          eventName: 'keydown',
          cacheElementReactInfo: true,
          interactableElementsOnly: false,
          eventFilter: (domEvent) => domEvent.code === 'Enter',
        },
        {
          eventName: 'keyup',
          cacheElementReactInfo: true,
          interactableElementsOnly: false,
          eventFilter: (domEvent) => domEvent.code === 'Enter',
        },
      ]
    },
    heartbeat: {
      channel,
      heartbeatInterval: 30 * 1000
    },
    surfaceMutationPublisher: {
      channel,
      cacheElementReactInfo: true,
    },
    network: {
      channel,
      requestFilter: request => !/robots/.test(request.url.toString()),
      requestUrlMarker: (request, params) => {
        const flowlet = FlowletManager.top();
        if (flowlet) {
          params.set('flowlet', flowlet.getFullName());
        }
      }
    }
  });

}
