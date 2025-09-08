/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type { Channel } from "hyperion-channel/src/Channel";
import type * as Types from "hyperion-util/src/Types";
import type {
  TextInputProps,
  PressableProps,
  RefreshControlProps,
  ScrollViewProps,
  SwitchProps,
  TouchableHighlightProps,
  TouchableWithoutFeedbackProps,
  ViewProps,
} from "react-native"

import {type GenericFunctionInterceptor, interceptFunction} from "hyperion-core/src/FunctionInterceptor";
import * as IReactComponent from "hyperion-react/src/IReactComponent";

'use strict';

type ALComponentType = 'class' | 'func' | 'dom';

type ALPickFuncions<T> = {
  [K in keyof T as K extends `on${string}` ? K : never]: T[K]
};

type ALFuncionProps =
  & ALPickFuncions<PressableProps>
  & ALPickFuncions<RefreshControlProps>
  & ALPickFuncions<ScrollViewProps>
  & ALPickFuncions<SwitchProps>
  & ALPickFuncions<TextInputProps>
  & ALPickFuncions<TouchableHighlightProps>
  & ALPickFuncions<TouchableWithoutFeedbackProps>
  & ALPickFuncions<ViewProps>;

type ALFunctionEventData = {
    component: string,
    prop: keyof ALFuncionProps,
    args: any[],
    type: ALComponentType,
};

type ALComponentPropChannel = Readonly<{
  al_react_function: [ALFunctionEventData],
}>;

export type InitOptions = Types.Options<{
  channel: Channel<ALComponentPropChannel>;
  intercept: ReadonlyArray<keyof ALFuncionProps>;
}>;

function isInterceptable(value: any): boolean {
  return value && typeof value === "function";
}

function intercept(name: string, props: any): GenericFunctionInterceptor<any> | null {
  if (!isInterceptable(props[name])) {
    return null
  }
  const funcInterceptor = interceptFunction(props[name]);
  props[name] = funcInterceptor.interceptor;
  return funcInterceptor;
}

export function publish(options: InitOptions): void {
  const { channel } = options;

  function interceptReactProps(
    props: any,
    componentName: string,
    componentType: ALComponentType,
  ): void {
    for (const name of options.intercept) {
      const interceptor = intercept(name, props);
      if (!interceptor) {
        continue
      }
      interceptor.onBeforeCallObserverAdd(function (this: any, ...args: any[]) {
        channel.emit("al_react_function", {
          component: componentName,
          prop: name,
          args,
          type: componentType,
        });
      });
    }
  }

  IReactComponent.onReactClassComponentElement.add((component, props) => {
    interceptReactProps(props, component.name, 'class')
  });

  IReactComponent.onReactFunctionComponentElement.add((component, props) => {
    interceptReactProps(props, component.name, 'func')
  });

  IReactComponent.onReactDOMElement.add((element, props) => {
    interceptReactProps(props, element, 'dom')
  });
}
