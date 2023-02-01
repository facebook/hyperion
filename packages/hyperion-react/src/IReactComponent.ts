/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { FunctionInterceptor, interceptFunction } from '@hyperion/hyperion-core/src/FunctionInterceptor';
import { interceptMethod } from '@hyperion/hyperion-core/src/MethodInterceptor';
import { ShadowPrototype } from '@hyperion/hyperion-core/src/ShadowPrototype';
import type {
  ReactComponentObjectProps,
  ReactComponentType,
  ReactSpecialComponentTypes
} from './IReact';

import { Hook } from '@hyperion/hook/src/Hook';
import * as IReact from './IReact';
import * as IReactElementVisitor from './IReactElementVisitor';

import { assert } from '@hyperion/global';
import type * as React from 'react';
import { Class, mixed } from './FlowToTsTypes';
import TestAndSet from './TestAndSet';

// $FlowIgnore[unclear-type]
type IAny = any;

interface ReactClassComponent<PropsType> extends React.Component<PropsType> {
  displayName?: string,
  name?: string,
};

export type ReactFunctionComponent<PropsType> = IReact.ReactStatelessFunctionalComponent<PropsType>;

export type GenericReactComponent = ReactComponentType<IAny>;

class ReactClassComponentShadowPrototype<PropsType> extends ShadowPrototype<ReactClassComponent<PropsType>> {
  name: string;

  render = interceptMethod('render', this);

  componentWillMount = interceptMethod('componentWillMount', this);

  componentDidMount = interceptMethod('componentDidMount', this);

  componentWillReceiveProps = interceptMethod('componentWillReceiveProps', this);

  shouldComponentUpdate = interceptMethod('shouldComponentUpdate', this);

  componentWillUpdate = interceptMethod('componentWillUpdate', this);

  componentDidUpdate = interceptMethod('componentDidUpdate', this);

  componentWillUnmount = interceptMethod('componentWillUnmount', this);

  componentDidCatch = interceptMethod('componentDidCatch', this);

  constructor(
    component: Class<ReactClassComponent<PropsType>> & { displayName?: string },
    classComponentParentClass: ReactClassComponent<PropsType>,
  ) {
    if (__DEV__) {
      const classComponentParentClass1 = component.prototype;
      assert(
        classComponentParentClass === classComponentParentClass1,
        'Unexpected setup',
      );
    }

    super(classComponentParentClass, null);

    this.name = component.displayName ?? component.name;
  }
}

export const onReactClassComponentIntercept: Hook<
  (shadow: ReactClassComponentShadowPrototype<IAny>) => void
> = new Hook();

export const onReactFunctionComponentIntercept: Hook<
  <PropsType extends {}> (fi: FunctionInterceptor<ReactFunctionComponent<PropsType>, 'render', ReactFunctionComponent<PropsType>>) => void
> = new Hook();

export const onReactDOMElement: Hook<
  (component: string, props: IAny) => void
> = new Hook();

export const onReactClassComponentElement: Hook<
  (component: Class<ReactClassComponent<IAny>>, props: IAny) => void
> = new Hook();

export const onReactFunctionComponentElement: Hook<
  (component: IReact.ReactStatelessFunctionalComponent<IAny>, props: IAny) => void
> = new Hook();

export const onReactSpecialObjectElement: Hook<
  (component: ReactSpecialComponentTypes<IAny>, props: IAny) => void
> = new Hook();

export type InitOptions =
  IReactElementVisitor.InitOptions &
  Readonly<{
    ReactModule: {
      Component: typeof React.Component;
    };
    IReactModule: IReact.IReactModuleExports;
    IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports;
  }>;

const initialized = new TestAndSet();
export function init(options: InitOptions): void {
  if (initialized.testAndSet()) {
    return;
  }
  const { ReactModule, IReactModule, IJsxRuntimeModule } = options;

  IReactElementVisitor.init(options);
  const interceptionInfo = new Map<
    TReactClassComponent | Class<TReactClassComponent>,
    ReactClassComponentShadowPrototype<PropsType> | null
  >();

  type PropsType = ReactComponentObjectProps;
  type TReactClassComponent = ReactClassComponent<PropsType>;
  type TReactFunctionComponent = IReact.ReactStatelessFunctionalComponent<PropsType>;

  function processReactClassComponent(
    component: Class<TReactClassComponent>,
    classComponentParentClass: TReactClassComponent,
  ): Class<TReactClassComponent> {
    // For class components, we just need to intercept them once
    if (interceptionInfo.has(component)) {
      return component;
    }
    interceptionInfo.set(component, null);

    if (!interceptionInfo.has(classComponentParentClass)) {
      const info = new ReactClassComponentShadowPrototype(
        component,
        classComponentParentClass,
      );
      interceptionInfo.set(classComponentParentClass, info);
      onReactClassComponentIntercept.call(info);
    }
    return component;
  }

  function processReactFunctionComponent(functionComponent: TReactFunctionComponent): TReactFunctionComponent {
    /**
     * For functional components, we should always replace them with the
     * intercepted version of them.
     * however, the interceptFunction itself will only assign a FunctionIntercetpr
     * to the function once.
     * So, we don't need to use the interceptionInfo map here.
     */

    const fi = __DEV__
      ? interceptFunction<TReactFunctionComponent>(
        functionComponent,
        false,
        null,
        (functionComponent.displayName ?? functionComponent.name) || void 0, // void 0 will force default for empty string
      )
      : interceptFunction<TReactFunctionComponent>(functionComponent);

    onReactFunctionComponentIntercept.call(fi);

    return fi.interceptor;
  }

  const processComponent = IReactElementVisitor.createReactElementVisitor<
    ReactComponentType<PropsType>,
    mixed,
    void,
    mixed
  >({
    domElement: (component, props) => {
      onReactDOMElement.call(component, props);
    },

    component: (component, props) => {
      let interceptedComponent: mixed = component;
      /**
       * This is a react component, and can be a class component constructor
       * or functional component.
       * In this case, we add the flowlet to the props and then
       * when various lifecycle functions are called we can read the flowlet.
       *
       * Note that react itself has no types, and flow compiler has some built-in
       * hard coded types just to be able to handle react types.
       * (see all the React$* types in react.js)
       * So, sadly the code bellow effectively cannot rely on types much.
       */

      // $FlowIgnore[prop-missing]
      const classComponentParentClass = component.prototype;

      if (
        classComponentParentClass instanceof ReactModule.Component ||
        typeof classComponentParentClass?.render === 'function' // possibly created via React.createClass
      ) {
        // $FlowIgnore[incompatible-exact]
        // $FlowIgnore[incompatible-type]
        // $FlowIgnore[incompatible-type-arg]
        // @ts-ignore
        const classComponent: Class<TReactClassComponent> = component;
        interceptedComponent = processReactClassComponent(
          classComponent,
          // $FlowIgnore[incompatible-exact]
          // $FlowIgnore[incompatible-call]
          classComponentParentClass,
        );
        onReactClassComponentElement.call(classComponent, props);
      } else {
        // $FlowIgnore[incompatible-use]
        // $FlowIgnore[prop-missing]
        // @ts-ignore
        const functionalComponent: TReactFunctionComponent = component;
        interceptedComponent =
          processReactFunctionComponent(functionalComponent);
        onReactFunctionComponentElement.call(functionalComponent, props);
      }
      return interceptedComponent;
    },

    forwardRef: (component, props) => {
      if (component.render && typeof component.render === 'function') {
        // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
        // @ts-ignore
        component.render = processReactFunctionComponent(component.render);
      }
      onReactSpecialObjectElement.call(component, props);
    },

    memo: (component, _props) => {
      if (typeof component.type === 'object') {
        const comp = component.type;
        if (comp.render && typeof comp.render === 'function') {
          // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
          // @ts-ignore
          comp.render = processReactFunctionComponent(comp.render);
        }
      }
    },

    provider: (component, props) => {
      onReactSpecialObjectElement.call(component, props);
    },

    context: (component, props) => {
      onReactSpecialObjectElement.call(component, props);
    },
  });

  function interceptArgs(
    component: ReactComponentType<PropsType>,
    props: PropsType,
  ): ReactComponentType<PropsType> {
    // $FlowIgnore[incompatible-return]
    // @ts-ignore
    return processComponent(component, props) ?? component;
  }

  const interceptArgsFunc = /* AdsALProfiler
    ? (
      component: ReactComponentType<PropsType>,
      props: PropsType,
    ): ReactComponentType<PropsType> => {
      const timer = AdsALProfiler.getALProfiler()?.timers.interceptArgs;
      timer?.start();
      const result = interceptArgs(component, props);
      timer?.stop();
      return result;
    }
    : */ interceptArgs;

  const handler = IJsxRuntimeModule.jsx.onArgsMapperAdd(args => {
    /**
     * TODO: T132536682 remove this guard later to speed things up
     * NOTE: tried using ErrorGuard.guard, and ErrorGuard.applyWithGuard but
     * as usual, Flow cannot handle complex function input/ouput types.
     * So, putting the raw try/catch, which is the actual implementation of
     * ErrorGaurd.applyWithGuard anyways.
     *
     * The rest of the logic in this module and ALSurface all run under this
     * function, so this should catch all possible errors.
     */
    try {
      const type = interceptArgsFunc(args[0], args[1]);
      args[0] = type;
    } catch (e) {
      // FBLogger('ads_manager_auto_logging')
      //   .catching(e)
      //   .mustfix('Error during React args interception: %s', e.message);
    }
    return args;
  });
  if (IJsxRuntimeModule.jsxs !== IJsxRuntimeModule.jsx) {
    IJsxRuntimeModule.jsxs.onArgsMapperAdd(handler);
  }
  IJsxRuntimeModule.jsxDEV.onArgsMapperAdd(handler);
  IReactModule.createElement.onArgsMapperAdd(handler);
}
