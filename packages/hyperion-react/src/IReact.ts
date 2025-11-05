/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { InterceptedModuleExports, interceptModuleExports, ModuleExportsKeys, validateModuleInterceptor } from 'hyperion-core/src/IRequire';

import type React from "react";

import { Class } from './FlowToTsTypes';
import { SafeGetterSetter } from "hyperion-util/src/SafeGetterSetter";

export type ReactComponentObjectProps = {
  [keys: string]: any,
};

//#region TS types for React
export type ReactNode = React.ReactNode;
export type ReactStatelessFunctionalComponent<T> = React.NamedExoticComponent<T>
type ReactElement<P> = React.ReactElement<P>;
//#endregion

//#region Flow types for React
// export type ReactNode = React.ReactNode;
// type ReactStatelessFunctionalComponent<T> = React.NamedExoticComponent<T>
// type ReactElement<P> = React.ReactElement<P>;
// type ReactStatelessFunctionalComponent<T> = React.NamedExoticComponent<T>
// type ReactElement<P> = React$MixedElement<P>;
//#endregion


export type ReactComponentStatics = Readonly<{
  // The rest of the component types usually have at least one of these members
  name?: string,
  displayName?: string,
}>;

export type ReactSpecialComponent = ReactComponentStatics & {
  $$typeof: symbol,
};

export type ReactForwardRefType<Props = ReactComponentObjectProps> = ReactSpecialComponent & {
  render: (props: Props) => ReactNode,
};

export type ReactMemoType<Props = ReactComponentObjectProps> = ReactSpecialComponent & {
  type: ReactForwardRefType<Props>,
};

export type ReactSpecialComponentTypes<Props = ReactComponentObjectProps> =
  | ReactForwardRefType<Props>
  | ReactMemoType<Props>
  | ReactSpecialComponent;


export type ReactElementComponentType<Props> =
  | ReactStatelessFunctionalComponent<Props>
  // | Class<React.AbstractComponent<Props>>
  | Class<React.Component<Props>>
  | ((props: Props) => ReactElement<Props>);

export type ReactComponentType<Props = ReactComponentObjectProps> =
  | string
  | React.JSXElementConstructor<Props>
  | ReactElementComponentType<Props>

type JSXType<Props = ReactComponentObjectProps> = (
  type: ReactComponentType<Props>,
  props: Props,
  children: React.ReactNode,
) => React.ReactElement<Props>;

type JsxRuntimeModuleExports = {
  /**
   * Used in production
   */
  jsx: JSXType,
  jsxs: JSXType,

  /**
   * Used in dev
   */
  jsxDEV: JSXType,
}

type ReactModuleExports = {
  createElement: typeof React.createElement;

  forwardRef: typeof React.forwardRef;

  useCallback: typeof React.useCallback;

  // useEffect: (effect: () => (void | (() => void)), deps?: Parameters<typeof React.useEffect>) => ReturnType<typeof React.useEffect>;
  useEffect: typeof React.useEffect;

  // useLayoutEffect: (effect: () => (void | (() => void)), deps?: Parameters<typeof React.useLayoutEffect>[1]) => ReturnType<typeof React.useEffect>;
  useLayoutEffect: typeof React.useLayoutEffect;

  useMemo: typeof React.useMemo;

  useReducer: typeof React.useReducer;

  useState: typeof React.useState;

  createContext: typeof React.createContext;

  useContext: typeof React.useContext;

  useRef: typeof React.useRef;
}

export type IJsxRuntimeModuleExports = InterceptedModuleExports<JsxRuntimeModuleExports>;
export type IReactModuleExports = InterceptedModuleExports<ReactModuleExports>;
export const JsxRuntimeModule = new SafeGetterSetter<JsxRuntimeModuleExports>("JsxRuntimeModule");
export const IJsxRuntimeModule = new SafeGetterSetter<IJsxRuntimeModuleExports>("IJsxRuntimeModule");
export const ReactModule = new SafeGetterSetter<ReactModuleExports>("ReactModule");
export const IReactModule = new SafeGetterSetter<IReactModuleExports>("IReactModule");

export function interceptRuntime(moduleId: string, moduleExports: JsxRuntimeModuleExports, failedExportsKeys?: ModuleExportsKeys<typeof moduleExports>): IJsxRuntimeModuleExports {
  if (!IJsxRuntimeModule.isSet()) {
    JsxRuntimeModule.set(moduleExports);

    const iJsxRuntimeModule = interceptModuleExports(moduleId, moduleExports, ['jsx', 'jsxs', 'jsxDEV']);

    /**
     * https://github.com/facebook/react/blob/cae635054e17a6f107a39d328649137b83f25972/packages/react/src/jsx/ReactJSX.js#L19
     * The '.jsxs' is a special function that in development it points to a unique
     * function, but in production, it points to '.jsx'.
     * Hyperion does not reintercept the same function intentionally to ensure
     * developer is aware of how the hooks are intalled on the function.
     * 
     * Therefore, we first call the interceptModuleExport without the failedExportsKeys which prevents validation
     * then we do the following patch up and then call the validation explicitly.
     */
    if (!__DEV__) {
      if (moduleExports.jsxs !== iJsxRuntimeModule.jsxs.interceptor) {
        moduleExports.jsxs = iJsxRuntimeModule.jsxs.interceptor;
      }
      if (moduleExports.jsxDEV !== iJsxRuntimeModule.jsxDEV.interceptor) {
        moduleExports.jsxDEV = iJsxRuntimeModule.jsxDEV.interceptor;
      }
    }

    validateModuleInterceptor(moduleId, moduleExports, iJsxRuntimeModule, failedExportsKeys);
    IJsxRuntimeModule.set(iJsxRuntimeModule);
  }
  return IJsxRuntimeModule.get();
}

export function intercept(moduleId: string, moduleExports: ReactModuleExports, failedExportsKeys?: ModuleExportsKeys<ReactModuleExports>): IReactModuleExports {
  if (!IReactModule.isSet()) {
    ReactModule.set(moduleExports);
    IReactModule.set(interceptModuleExports(
      moduleId,
      moduleExports,
      [
        'createElement',
        'forwardRef',
        'useCallback',
        'useEffect',
        'useLayoutEffect',
        'useMemo',
        'useReducer',
        'useState'
      ],
      failedExportsKeys
    ));
  }
  return IReactModule.get();
}
