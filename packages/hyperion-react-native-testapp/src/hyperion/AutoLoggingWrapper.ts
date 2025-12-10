/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AutoLogging, TestAndSet } from "hyperion-react-native/src/"
import { SyncChannel } from "./Channel";
import * as IReact from "hyperion-react/src/IReact";
import React from "react";
import ReactDev from "react/jsx-runtime";

globalThis.__DEV__ = true;

export let interceptionStatus = "disabled";

const initialized = new TestAndSet();

export function init() {
  if (initialized.testAndSet()) {
    return;
  }

  console.log("Initializing AutoLoggingWrapper");

  // ReactModule/JSX
  const IReactModule = IReact.intercept("react", React as any, []);
  const IJsxRuntimeModule = IReact.interceptRuntime("react/jsx-runtime", ReactDev as any, []);

  const channel = SyncChannel;

  AutoLogging.init({
    react: {
      ReactModule: React as any,
      IReactModule,
      IJsxRuntimeModule: IJsxRuntimeModule as any,
      enableInterceptClassComponentConstructor: true,
      enableInterceptClassComponentMethods: true,
      enableInterceptFunctionComponentRender: true,
      enableInterceptDomElement: true,
      enableInterceptComponentElement: true,
      enableInterceptSpecialElement: true,
    },
    channel,
    props: {
      intercept: [
        "onBlur",
        "onChange",
        "onChangeText",
        "onContentSizeChange",
        "onEndEditing",
        "onFocus",
        "onHoverIn",
        "onHoverOut",
        "onKeyPress",
        "onLayout",
        "onLongPress",
        "onPress",
        "onPressIn",
        "onPressOut",
        "onScroll",
        "onSelectionChange",
        "onSubmitEditing",
      ],
      enableInterceptReactComponentProp: true,
      enableReactComponentPropPublisher: true,
    },
  });

  channel.addListener("al_react_component_prop", (event) => {
    console.log("al_react_component_prop", event);
  });

  channel.addListener("al_surface_mount", (event) => {
    console.log("al_surface_mount", event);
  });
}
