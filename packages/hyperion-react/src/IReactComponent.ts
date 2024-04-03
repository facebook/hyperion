/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';


import type * as Types from "@hyperion/hyperion-util/src/Types";
import type * as React from 'react';
import type {
  ReactComponentObjectProps,
  ReactComponentType,
  ReactSpecialComponentTypes
} from './IReact';

import { assert } from '@hyperion/hyperion-global';
import { Hook } from '@hyperion/hyperion-hook/src/Hook';
import { FunctionInterceptor, interceptFunction } from '@hyperion/hyperion-core/src/FunctionInterceptor';
import { interceptMethod } from '@hyperion/hyperion-core/src/MethodInterceptor';
import { ShadowPrototype } from '@hyperion/hyperion-core/src/ShadowPrototype';
import TestAndSet from '@hyperion/hyperion-util/src/TestAndSet';
import { Class, mixed } from './FlowToTsTypes';
import * as IReact from './IReact';
import * as IReactElementVisitor from './IReactElementVisitor';
import { interceptConstructor } from "@hyperion/hyperion-core/src/ConstructorInterceptor";

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

  ctor: FunctionInterceptor<ReactClassComponent<PropsType>, string, new (props: PropsType, context?: unknown) => ReactClassComponent<PropsType>>;

  render = interceptMethod('render', this);

  componentWillMount = interceptMethod('componentWillMount', this);

  componentDidMount = interceptMethod('componentDidMount', this);

  componentWillReceiveProps = interceptMethod('componentWillReceiveProps', this);

  shouldComponentUpdate = interceptMethod('shouldComponentUpdate', this);

  componentWillUpdate = interceptMethod('componentWillUpdate', this);

  componentDidUpdate = interceptMethod('componentDidUpdate', this);

  componentWillUnmount = interceptMethod('componentWillUnmount', this);

  componentDidCatch = interceptMethod('componentDidCatch', this);

  setState = interceptMethod('setState', this);

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
    this.ctor = interceptConstructor(component)
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

export type InitOptions = Types.Options<
  IReactElementVisitor.InitOptions &
  {
    ReactModule: {
      Component: typeof React.Component;
    };
    IReactModule: IReact.IReactModuleExports;
    IJsxRuntimeModule: IReact.IJsxRuntimeModuleExports;

    enableInterceptClassComponentConstructor?: boolean;
    enableInterceptClassComponentMethods?: boolean;
    enableInterceptFunctionComponentRender?: boolean;

    enableInterceptDomElement?: boolean;
    enableInterceptComponentElement?: boolean;
    enableInterceptSpecialElement?: boolean;
  }
>;

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
    if (!options.enableInterceptClassComponentMethods && !options.enableInterceptClassComponentConstructor) {
      return component;
    }
    // For class components, we just need to intercept them once
    if (interceptionInfo.has(component)) {
      return component;
    }
    interceptionInfo.set(component, null);

    let info = interceptionInfo.get(classComponentParentClass);
    if (!info) {
      info = new ReactClassComponentShadowPrototype(
        component,
        classComponentParentClass,
      );
      interceptionInfo.set(classComponentParentClass, info);
      onReactClassComponentIntercept.call(info);
    }

    return options.enableInterceptClassComponentConstructor ? info.ctor.interceptor : component;
  }

  function processReactFunctionComponent(functionComponent: TReactFunctionComponent): TReactFunctionComponent {
    if (!options.enableInterceptFunctionComponentRender) {
      return functionComponent;
    }

    /**
     * For functional components, we should always replace them with the
     * intercepted version of them.
     * however, the interceptFunction itself will only assign a FunctionIntercetpr
     * to the function once.
     * So, we don't need to use the interceptionInfo map here.
     */

    const fi = interceptFunction<TReactFunctionComponent>(
      functionComponent,
      false,
      null,
      (functionComponent.displayName ?? functionComponent.name) || void 0, // void 0 will force default for empty string
    );
    onReactFunctionComponentIntercept.call(fi);

    return fi.interceptor;
  }

  const processComponent = IReactElementVisitor.createReactElementVisitor<
    ReactComponentType<PropsType>,
    mixed,
    void,
    mixed
  >({
    domElement: options.enableInterceptDomElement
      ? (component, props) => {
        onReactDOMElement.call(component, props);
      }
      : void 0,

    component:
      options.enableInterceptComponentElement
        || options.enableInterceptFunctionComponentRender
        || options.enableInterceptClassComponentMethods
        || options.enableInterceptClassComponentConstructor
        ? (component, props) => {
          let interceptedComponent: mixed = component;
          /**
           * This is a react component, and can be a class component constructor
           * or functional component.
           *
           * Note that react itself has no types, and flow compiler has some built-in
           * hard coded types just to be able to handle react types.
           * (see all the React$* types in react.js)
           * So, sadly the code bellow effectively cannot rely on types much.
           * 
           * We need to check for two conditions:
           * 1- the component is a class constructor and it inherits from ReactModule.Component
           *    or something that has a .render() function. 
           * 2- the component is a normal function, i.e. the .prototype is a plain object with just one .constructor in it.
             *  That means the __proto__ of this object is an empty object (i.e. the __proto__ of that object is null)
             *  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/prototype#:~:text=prototype%20property%2C%20by%20default
           */

          const classComponentParentClass = component.prototype;
          let classComponentParentClassParent;

          if (
            classComponentParentClass && (
              classComponentParentClass instanceof ReactModule.Component ||
              typeof classComponentParentClass.render === 'function' || // possibly created via React.createClass
              (
                (classComponentParentClassParent = Object.getPrototypeOf(classComponentParentClass)) &&
                Object.getPrototypeOf(classComponentParentClassParent)
              ) || // not a plain function, may be with some other lifecycle methods. 
              classComponentParentClass === ReactModule.Component.prototype // in case buggy code didn't properly inherit from ReactModule.Component
            )
          ) {
            // @ts-ignore
            const classComponent: Class<TReactClassComponent> = component;
            interceptedComponent = processReactClassComponent(
              classComponent,
              classComponentParentClass,
            );
            onReactClassComponentElement.call(classComponent, props);
          } else {
            // @ts-ignore
            const functionalComponent: TReactFunctionComponent = component;
            interceptedComponent =
              processReactFunctionComponent(functionalComponent);
            onReactFunctionComponentElement.call(functionalComponent, props);
          }
          return interceptedComponent;
        }
        : void 0,

    forwardRef: options.enableInterceptSpecialElement
      ? (component, props) => {
        if (component.render && typeof component.render === 'function') {
          // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
          // @ts-ignore
          component.render = processReactFunctionComponent(component.render);
        }
        onReactSpecialObjectElement.call(component, props);
      }
      : void 0,

    memo: options.enableInterceptSpecialElement
      ? (component, _props) => {
        if (typeof component.type === 'object') {
          const comp = component.type;
          if (comp.render && typeof comp.render === 'function') {
            // $FlowIgnore[incompatible-type] // https://fb.workplace.com/groups/flow/permalink/9565274296854433/
            // @ts-ignore
            comp.render = processReactFunctionComponent(comp.render);
          }
        }
      }
      : void 0,

    provider: options.enableInterceptSpecialElement
      ? (component, props) => {
        onReactSpecialObjectElement.call(component, props);
      }
      : void 0,

    context: options.enableInterceptSpecialElement
      ? (component, props) => {
        onReactSpecialObjectElement.call(component, props);
      }
      : void 0,
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

  const handler = IJsxRuntimeModule.jsx.onBeforeCallMapperAdd(args => {
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
    IJsxRuntimeModule.jsxs.onBeforeCallMapperAdd(handler);
  }
  IJsxRuntimeModule.jsxDEV.onBeforeCallMapperAdd(handler);
  IReactModule.createElement.onBeforeCallMapperAdd(handler);
}
