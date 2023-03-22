/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel } from "@hyperion/hook/src/Channel";
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";
import * as IReact from "@hyperion/hyperion-react/src/IReact";
import * as IReactDOM from "@hyperion/hyperion-react/src/IReactDOM";
import React from 'react';
import * as ReactDOM from "react-dom";
import ReactDev from "react/jsx-dev-runtime";
import { FlowletManager } from "./FlowletManager";

export let interceptionStatus = "disabled";
export function init() {
  interceptionStatus = "enabled";

  const IReactModule = IReact.intercept("react", React, [])
  const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-dev-runtime", ReactDev as any, []);
  const IReactDOMModule = IReactDOM.intercept("react-dom", ReactDOM, []);

  const channel = new Channel<
    AutoLogging.ALChannelEvent &
    { test: [number, string] }
  >();
  channel.on("test").add((i, s) => { // Showing channel can be extend beyond expected types

  });

  const testCompValidator = (name: string) => !name.match(/(^Surface(Proxy)?)/);

  AutoLogging.init({
    flowletManager: FlowletManager,
    domSurfaceAttributeName: 'data-surfaceid',
    componentNameValidator: testCompValidator,
    surface: {
      ReactModule: React as any,
      IReactDOMModule,
      IReactModule,
      IJsxRuntimeModule,
      channel,
    },
    uiEventPublisher: {
      uiEvents: ['click'],
      cacheElementReactInfo: true,
      channel
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
      channel
    }
  });

  ([
    'al_surface_mount',
    'al_surface_unmount',
    'al_ui_event',
    'al_heartbeat_event',
    'al_surface_mutation_event',
    'al_network_request',
    'al_network_response',
  ] as const).forEach(eventName => {
    channel.on(eventName).add(ev => {
      console.log(eventName, ev, performance.now());
    });

  });
}
