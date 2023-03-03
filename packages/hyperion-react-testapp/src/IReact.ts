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
import * as Surface from "./component/Surface";
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
    surface: {
      ReactModule: React as any,
      IReactDOMModule,
      IReactModule,
      IJsxRuntimeModule,
      flowletManager: FlowletManager,
      channel,
      domSurfaceAttributeName: 'data-surfaceid'
    },
    uiEventPublisher: {
      uiEvents: ['click'],
      flowletManager: FlowletManager,
      cacheElementReactInfo: true,
      componentNameValidator: testCompValidator,
      channel
    },
    heartbeat: {
      channel,
      heartbeatInterval: 30 * 1000
    },
    surfaceMutationPublisher: {
      channel,
      flowletManager: FlowletManager,
      cacheElementReactInfo: true,
      componentNameValidator: testCompValidator,
      domSurfaceAttributeName: 'data-surfaceid',
    }
  });

  Surface.init(AutoLogging.getSurfaceRenderer());

  channel.on('al_surface_mount').add(ev => {
    console.log('surface_mount', ev, performance.now());
  });
  channel.on('al_surface_unmount').add(ev => {
    console.log('surface_unmount', ev, performance.now());
  });
  channel.on('al_ui_event').add(ev => {
    console.log('ui_event', ev, performance.now());
  });
  channel.on('al_heartbeat').add(ev => {
    console.log('heartbeat', ev, performance.now());
  });
  channel.on('al_surface_mutation_event').add(ev => {
    console.log('surface_mutation_event', ev, performance.now());
  });
}
