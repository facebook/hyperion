/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import { interceptFunction } from 'hyperion-core/src/FunctionInterceptor';
import * as IReactComponent from '../src/IReactComponent';
import type {
  IJsxRuntimeModuleExports,
  IReactModuleExports,
  ReactComponentObjectProps,
} from '../src/IReact';

describe('React component interception compatibility', () => {
  it('continues to invoke established web function-render interceptors', () => {
    const renderCalls: ReactComponentObjectProps[] = [];
    const installed = '__WEB_RENDER_REGRESSION_TEST__';
    IReactComponent.onReactFunctionComponentIntercept.add((interceptor) => {
      if (interceptor.testAndSet(installed)) return;
      interceptor.onBeforeCallObserverAdd((props) => {
        renderCalls.push(props);
      });
    });

    const renderElement = (
      type: React.ElementType,
      props: ReactComponentObjectProps
    ) => ({ type, props });
    const jsx = interceptFunction(renderElement);
    const jsxDEV = interceptFunction(renderElement);
    const createElement = interceptFunction(React.createElement);

    IReactComponent.init({
      ReactModule: React,
      IReactModule: { createElement } as unknown as IReactModuleExports,
      IJsxRuntimeModule: {
        jsx,
        jsxs: jsx,
        jsxDEV,
      } as unknown as IJsxRuntimeModuleExports,
      enableInterceptFunctionComponentRender: true,
    });

    function FunctionComponent(props: ReactComponentObjectProps) {
      return props.value;
    }
    const props = { value: 'rendered' };
    const element = jsx.interceptor(FunctionComponent, props) as unknown as {
      type: (props: ReactComponentObjectProps) => unknown;
    };

    expect(element.type).not.toBe(FunctionComponent);
    expect(element.type(props)).toBe('rendered');
    expect(renderCalls).toEqual([props]);
  });
});
