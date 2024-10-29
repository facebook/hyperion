/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as Visualizer from "@hyperion/hyperion-autologging-visualizer/src/Visualizer";
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
import { ALExtensibleEvent } from "@hyperion/hyperion-autologging/src/ALType";
import { getEventExtension } from "@hyperion/hyperion-autologging/src/ALEventExtension";
import * as Flags from "@hyperion/hyperion-global/src/Flags";
import "@hyperion/hyperion-autologging/src/reference";
import * as PluginEventHash from "@hyperion/hyperion-autologging-plugin-eventhash/src/index";

export let interceptionStatus = "disabled";

export function init() {
  Flags.setFlags({
    preciseTriggerFlowlet: true,
    optimizeInteractibiltyCheck: true,
  });

  interceptionStatus = "enabled";
  const flowletManager = FlowletManager;

  const IReactModule = IReact.intercept("react", React, [])
  const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-dev-runtime", ReactDev as any, []);
  const IReactDOMModule = IReactDOM.intercept("react-dom", ReactDOM, []);

  const channel = SyncChannel;

  Visualizer.init({
    flowletManager,
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

  AutoLogging.init({
    flowletManager,
    channel,
    plugins: [
      PluginEventHash.init
    ],
    componentNameValidator: testCompValidator,
    flowletPublisher: {
      channel
    },
    triggerFlowlet: {
      enableReactMethodFlowlet: false,
      enableFlowletConstructorTracking: false,
    },
    react: {
      ReactModule: React as any,
      IReactDOMModule,
      IReactModule,
      IJsxRuntimeModule,
    },
    surface: {
      enableReactDomPropsExtension: false,
    },
    elementText: {
      updateText(elementText: ExtendedElementText, domSource) {
        elementText.isExtended = true;
        // console.log("Element Text ", elementText, domSource);
      },
    },
    uiEventPublisher: {
      uiEvents: [
        {
          eventName: 'click',
          cacheElementReactInfo: true,
          enableElementTextExtraction: true,
          eventFilter: (domEvent) => domEvent.isTrusted
        },
        {
          eventName: 'mousedown',
          cacheElementReactInfo: true,
          enableElementTextExtraction: false,
          eventFilter: (domEvent) => domEvent.isTrusted
        },
        {
          eventName: 'keydown',
          cacheElementReactInfo: true,
          interactableElementsOnly: false,
          enableElementTextExtraction: false,
          eventFilter: (domEvent) => domEvent.code === 'Enter',
        },
        {
          eventName: 'keyup',
          cacheElementReactInfo: true,
          interactableElementsOnly: false,
          enableElementTextExtraction: false,
          eventFilter: (domEvent) => domEvent.code === 'Enter',
        },
        {
          eventName: 'change',
          cacheElementReactInfo: true,
          enableElementTextExtraction: true,
          interactableElementsOnly: false,
        },
        {
          eventName: 'mouseover',
          cacheElementReactInfo: true,
          interactableElementsOnly: false,
          enableElementTextExtraction: true,
          durationThresholdToEmitHoverEvent: 1000,
        },
      ]
    },
    heartbeat: {
      heartbeatInterval: 30 * 1000
    },
    surfaceMutationPublisher: {
      cacheElementReactInfo: true,
      enableElementTextExtraction: false,
    },
    surfaceVisibilityPublisher: {},
    network: {
      requestFilter: request => !/robots/.test(request.url.toString()),
      requestUrlMarker: (request, params) => {
        const flowlet = FlowletManager.top();
        if (flowlet) {
          params.set('flowlet', flowlet.getFullName());
        }
      }
    },
    domSnapshotPublisher: {
      eventConfig: [
        'al_ui_event',
        'al_surface_visibility_event'
      ]
    }
  });

  console.log('AutoLogging.init options:', AutoLogging.getInitOptions());
}
