/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from 'hyperion-channel/src/Channel';
import type { ALRuntimeChannelEventMap } from './ALChannel';
import type { ReactNativeModuleExports } from './IReactNative';
import type { ReactModuleExports } from './ReactNativeElementObservation';

type LegacyComponentType = 'class' | 'func' | 'dom';
type LegacyMapper = (args: unknown[]) => unknown[];
type LegacyHandler = (...args: never[]) => unknown;

export interface LegacyCallInterceptor {
  onBeforeCallMapperAdd(mapper: LegacyMapper): unknown;
}

export interface LegacyReactModuleInterceptors {
  createElement?: LegacyCallInterceptor;
}

export interface LegacyJSXRuntimeInterceptors {
  jsx?: LegacyCallInterceptor;
  jsxs?: LegacyCallInterceptor;
  jsxDEV?: LegacyCallInterceptor;
}

export interface LegacyReactOptions {
  ReactModule?: ReactModuleExports;
  ReactNativeModule?: ReactNativeModuleExports;
  IReactModule?: LegacyReactModuleInterceptors;
  IJsxRuntimeModule?: LegacyJSXRuntimeInterceptors;
  enableInterceptClassComponentConstructor?: boolean;
  enableInterceptClassComponentMethods?: boolean;
  enableInterceptFunctionComponentRender?: boolean;
  enableInterceptDomElement?: boolean;
  enableInterceptComponentElement?: boolean;
  enableInterceptSpecialElement?: boolean;
  enableReactComponentPublisher?: boolean;
}

export interface LegacyComponentPropsOptions {
  intercept?: readonly string[];
  enableInterceptReactComponentProp?: boolean;
  enableReactComponentPropPublisher?: boolean;
}

export interface LegacyAutoLoggingOptions {
  react?: LegacyReactOptions;
  props?: LegacyComponentPropsOptions | null;
  componentProps?: LegacyComponentPropsOptions | null;
}

interface ComponentInfo {
  name: string;
  type: LegacyComponentType;
  canPublishMount: boolean;
}

// TODO: Remove this compatibility path after WWW/AMA migrates to the modern
// AutoLogging configuration and event families.
const installedInterceptors = new WeakSet<object>();
const wrappedHandlers = new WeakSet<LegacyHandler>();
const wrappersByHandler = new WeakMap<
  LegacyHandler,
  Map<string, LegacyHandler>
>();

function resolveName(type: unknown): string {
  if (typeof type === 'string') return type;
  if (typeof type === 'function') {
    const component = type as { displayName?: string; name?: string };
    return component.displayName ?? component.name ?? '';
  }
  if (typeof type === 'object' && type != null) {
    const component = type as {
      displayName?: string;
      render?: { displayName?: string; name?: string };
      type?: unknown;
    };
    return (
      component.displayName ??
      component.render?.displayName ??
      component.render?.name ??
      (component.type == null ? '' : resolveName(component.type))
    );
  }
  return '';
}

function getComponentInfo(
  value: unknown,
  options: LegacyReactOptions
): ComponentInfo | null {
  if (typeof value === 'string') {
    if (!options.enableInterceptDomElement) return null;
    return { name: value, type: 'dom', canPublishMount: false };
  }
  if (typeof value === 'function') {
    const component = value as {
      prototype?: object & { render?: unknown };
    };
    const prototype = component.prototype;
    const Component = options.ReactModule?.Component;
    const isClass =
      prototype != null &&
      (typeof prototype.render === 'function' ||
        (Component != null && prototype instanceof Component));
    if (isClass) {
      const enabled =
        options.enableInterceptClassComponentConstructor === true ||
        options.enableInterceptClassComponentMethods === true ||
        options.enableInterceptComponentElement === true;
      if (!enabled) return null;
      return {
        name: resolveName(value),
        type: 'class',
        canPublishMount:
          options.enableInterceptClassComponentConstructor === true ||
          options.enableInterceptClassComponentMethods === true,
      };
    }
    const enabled =
      options.enableInterceptFunctionComponentRender === true ||
      options.enableInterceptComponentElement === true;
    if (!enabled) return null;
    return {
      name: resolveName(value),
      type: 'func',
      canPublishMount: options.enableInterceptFunctionComponentRender === true,
    };
  }
  if (
    typeof value === 'object' &&
    value != null &&
    options.enableInterceptSpecialElement === true
  ) {
    return {
      name: resolveName(value),
      type: 'func',
      canPublishMount: options.enableInterceptFunctionComponentRender === true,
    };
  }
  return null;
}

function getLegacyHandler(
  handler: LegacyHandler,
  component: ComponentInfo,
  prop: string,
  publish: boolean,
  channel: Channel<ALRuntimeChannelEventMap>
): LegacyHandler {
  if (wrappedHandlers.has(handler)) return handler;
  let wrappers = wrappersByHandler.get(handler);
  if (wrappers == null) {
    wrappers = new Map();
    wrappersByHandler.set(handler, wrappers);
  }
  const key = `${component.type}:${component.name}:${prop}:${String(publish)}`;
  let wrapper = wrappers.get(key);
  if (wrapper == null) {
    wrapper = function (this: unknown, ...args: unknown[]) {
      if (publish) {
        channel.emitSafely('al_react_component_prop', {
          component: component.name,
          prop,
          args,
          type: component.type,
        });
      }
      return Reflect.apply(handler, this, args);
    };
    wrappedHandlers.add(wrapper);
    wrappers.set(key, wrapper);
  }
  return wrapper;
}

function installMapper(
  interceptor: LegacyCallInterceptor | undefined,
  mapper: LegacyMapper
): void {
  if (interceptor == null || installedInterceptors.has(interceptor)) return;
  interceptor.onBeforeCallMapperAdd(mapper);
  installedInterceptors.add(interceptor);
}

export function hasLegacyAutoLoggingOptions(
  options: LegacyAutoLoggingOptions
): boolean {
  const react = options.react;
  return (
    options.props !== undefined ||
    options.componentProps !== undefined ||
    react?.IReactModule !== undefined ||
    react?.IJsxRuntimeModule !== undefined ||
    react?.enableInterceptClassComponentConstructor !== undefined ||
    react?.enableInterceptClassComponentMethods !== undefined ||
    react?.enableInterceptFunctionComponentRender !== undefined ||
    react?.enableInterceptDomElement !== undefined ||
    react?.enableInterceptComponentElement !== undefined ||
    react?.enableInterceptSpecialElement !== undefined ||
    react?.enableReactComponentPublisher !== undefined
  );
}

export function isLegacyAutoLoggingEnabled(
  options: LegacyAutoLoggingOptions
): boolean {
  const react = options.react;
  const props = options.props ?? options.componentProps;
  return (
    react?.enableInterceptClassComponentConstructor === true ||
    react?.enableInterceptClassComponentMethods === true ||
    react?.enableInterceptFunctionComponentRender === true ||
    react?.enableInterceptDomElement === true ||
    react?.enableInterceptComponentElement === true ||
    react?.enableInterceptSpecialElement === true ||
    props?.enableInterceptReactComponentProp === true
  );
}

export function installLegacyAutoLogging(
  options: LegacyAutoLoggingOptions,
  channel: Channel<ALRuntimeChannelEventMap>,
  defaultInterceptProps: readonly string[]
): void {
  const react = options.react;
  if (react == null) return;
  const propOptions = options.props ?? options.componentProps;
  const interceptProps = propOptions?.intercept ?? defaultInterceptProps;
  const mapper: LegacyMapper = (args) => {
    const component = getComponentInfo(args[0], react);
    const props = args[1];
    if (component == null || typeof props !== 'object' || props == null) {
      return args;
    }
    if (
      react.enableReactComponentPublisher === true &&
      component.canPublishMount
    ) {
      channel.emitSafely('al_react_component_mount', {
        surface: component.name,
        args: component.type === 'class' ? [] : [props],
      });
    }
    if (propOptions?.enableInterceptReactComponentProp !== true) return args;

    let nextProps: Record<string, unknown> | null = null;
    const applicationProps = props as Record<string, unknown>;
    for (const prop of interceptProps) {
      const handler = applicationProps[prop];
      if (typeof handler !== 'function') continue;
      const wrapped = getLegacyHandler(
        handler as LegacyHandler,
        component,
        prop,
        propOptions.enableReactComponentPropPublisher === true,
        channel
      );
      if (wrapped === handler) continue;
      nextProps ??= { ...applicationProps };
      nextProps[prop] = wrapped;
    }
    if (nextProps != null) args[1] = nextProps;
    return args;
  };

  const jsxRuntime = react.IJsxRuntimeModule;
  installMapper(jsxRuntime?.jsx, mapper);
  installMapper(jsxRuntime?.jsxs, mapper);
  installMapper(jsxRuntime?.jsxDEV, mapper);
  installMapper(react.IReactModule?.createElement, mapper);
}
