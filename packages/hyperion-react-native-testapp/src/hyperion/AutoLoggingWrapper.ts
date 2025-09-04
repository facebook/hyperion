/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as ALSurface from 'hyperion-autologging/src/react-native/ALSurface';
import * as IReact from 'hyperion-react/src/IReact';
import * as IReactComponent from 'hyperion-react/src/IReactComponent';
import ReactDev from 'react/jsx-runtime';
import React from 'react';
import * as IPromise from 'hyperion-core/src/IPromise';
import TestAndSet from 'hyperion-test-and-set/src/TestAndSet';
import interceptReactProps from './interceptReactProps';
import { ALFlowletManager } from 'hyperion-autologging/src/ALFlowletManager';
import { Channel } from 'hyperion-channel/src/Channel';
import { assert } from 'hyperion-globals';

globalThis.__DEV__ = true;

export let initializationStatus = 'not_initialized';

const initialized = new TestAndSet();

export type InitResults = Readonly<{
  surfaceRenderer: ALSurface.ALSurfaceHOC;
  surfaceComponent: ALSurface.ALSurfaceComponent;
}>;

let cachedResults: InitResults | null = null;

export function init(): boolean {
  if (cachedResults !== null) {
    return false; // Already initialized
  }

  if (!initialized.testAndSet()) {
    __DEV__ && console.log('Running RN AutoLogging init!');
    initializationStatus = 'initializing';

    try {
      const surfaceRenderers = initializeReactInterception();

      cachedResults = {
        surfaceRenderer: surfaceRenderers.surfaceHOComponent,
        surfaceComponent: surfaceRenderers.surfaceComponent,
      };

      initializationStatus = 'initialized';
      __DEV__ &&
        console.log('React Native AutoLogging initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize React Native AutoLogging:', error);
      initializationStatus = 'error';
      return false;
    }
  }

  return false;
}

function initializeReactInterception() {
  const RENDER_FUNCTION_INTERCEPTED = '__IS_RENDER_INTERCEPTED__TODO_LIST';

  const IReactModule = IReact.intercept('react', React as any, []);
  const IJsxRuntimeModule = IReact.interceptRuntime(
    'react/jsx-runtime',
    ReactDev as any,
    []
  );

  const flowletManager = new ALFlowletManager();
  const channel = new Channel<ALSurface.ALChannelSurfaceEvent>();

  function observer(name: string) {
    return function <T, V>(this: T, value: V) {
      __DEV__ && console.log(name, this, value);
    };
  }

  function observer1(name: string) {
    return function <T>(this: T) {
      __DEV__ && console.log(name, this);
    };
  }

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
    const prefix = `[${component.name}][Class]`;
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix + '[' + key + ']'));
    }
  });

  IReactComponent.onReactFunctionComponentElement.add((component, props) => {
    const prefix = `[${component.name || component.displayName}][Func]`;
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix + '[' + key + ']'));
    }
  });

  IReactComponent.onReactDOMElement.add((element, props) => {
    const prefix = `[${element}][DOM]`;
    const interceptor = interceptReactProps(props);
    for (const [key, value] of Object.entries(interceptor)) {
      value?.onBeforeCallObserverAdd(observer(prefix + '[' + key + ']'));
    }
  });

  IReactComponent.onReactClassComponentIntercept.add((shadow) => {
    const render = shadow.render;
    if (!render.testAndSet(RENDER_FUNCTION_INTERCEPTED)) {
      const name = render.getOriginal().name ?? shadow.name;
      render.onBeforeCallObserverAdd(observer1(`[${name}][Class][render]`));
    }
  });

  IReactComponent.onReactFunctionComponentIntercept.add((render) => {
    const name: string = render.getOriginal().displayName ?? render.name;
    if (!render.testAndSet(RENDER_FUNCTION_INTERCEPTED) && name != null) {
      render.onBeforeCallObserverAdd(observer1(`[${name}][Func][render]`));
    }
  });

  // Add Promise interception for debugging
  IPromise.resolve.onBeforeCallObserverAdd(observer('IPromise.resolve'));
  IPromise.reject.onBeforeCallObserverAdd(observer('IPromise.reject'));
  IPromise.all.onBeforeCallObserverAdd(observer('IPromise.all'));

  const surfaceRenderers = ALSurface.init({
    flowletManager,
    channel,
    react: {
      ReactModule: {
        createElement: React.createElement as any,
        useLayoutEffect: React.useLayoutEffect as any,
        useRef: React.useRef as any,
        createContext: React.createContext as any,
        useContext: React.useContext as any,
        Children: React.Children as any,
        Component: React.Component as any,
      },
      IReactModule,
      IJsxRuntimeModule,
    },
    enableReactPropsExtension: false,
  });

  return surfaceRenderers;
}

export function getSurfaceComponent(
  defaultALSurfaceComponent?: ALSurface.ALSurfaceComponent
): ALSurface.ALSurfaceComponent {
  const component =
    cachedResults?.surfaceComponent ?? defaultALSurfaceComponent;
  assert(
    component != null,
    'RN AutoLogging must have been initialized first. Did you forget to call .init() functions?',
    {
      logger: {
        error: (msg) => {
          console.error(msg);
          throw msg;
        },
      },
    }
  );
  return component;
}
