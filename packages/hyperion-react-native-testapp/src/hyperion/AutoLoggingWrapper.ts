/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IReact from "hyperion-react/src/IReact";
import * as IReactComponent from "hyperion-react/src/IReactComponent";
import ReactDev from "react/jsx-runtime";
import React from "react";
import * as IPromise from "hyperion-core/src/IPromise";
import {interceptFunction} from "hyperion-core/src/FunctionInterceptor";
import TestAndSet from 'hyperion-test-and-set/src/TestAndSet';
import interceptReactProps from "./interceptReactProps";

globalThis.__DEV__ = true;

export let interceptionStatus = "disabled";

const initialized = new TestAndSet();

export function init() {
  if (initialized.testAndSet()) {
    return;
  }

  console.log('Running AL init!');

  function observer(name: string) {
    return function <T, V>(this: T, value: V) {
      console.log(name, this, value);
    }
  }

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
    const prefix = `[${component.name}][Class]`
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix+"["+key+"]"));
    }
  });

  IReactComponent.onReactFunctionComponentElement.add((component, props) => {
    const prefix = `[${component.name || component.displayName}][Func]`
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix+"["+key+"]"));
    }
  });

  IReactComponent.onReactDOMElement.add((element, props) => {
    const prefix = `[${element}][DOM]`;
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix+"["+key+"]"));
    }
  });

  /**
   * *****************************
   * IReactComponent / JSX - END
   * *****************************
   */

  // Add Promise interception for debugging
  IPromise.resolve.onBeforeCallObserverAdd(observer('IPromise.resolve'));
  IPromise.reject.onBeforeCallObserverAdd(observer('IPromise.reject'));
  IPromise.all.onBeforeCallObserverAdd(observer('IPromise.all'));
}
