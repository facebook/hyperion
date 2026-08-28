/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type { ALReactNativePlugin } from './ALRuntime';
import type { ALReactNativeEventMap } from './ALTypes';
import type { ReactNativeModuleExports } from './IReactNative';
import type { ReactModuleExports } from './ReactNativeElementObservation';

type LegacyComponentType = 'class' | 'func' | 'dom';
type LegacyMapper = (args: unknown[]) => unknown[];
type LegacyHandler = (this: unknown, ...args: unknown[]) => unknown;

export interface LegacyCallInterceptor {
  onBeforeCallMapperAdd(mapper: LegacyMapper): unknown;
}

export interface LegacyReactModuleInterceptors {
  readonly createElement?: LegacyCallInterceptor;
}

export interface LegacyJSXRuntimeInterceptors {
  readonly jsx?: LegacyCallInterceptor;
  readonly jsxs?: LegacyCallInterceptor;
  readonly jsxDEV?: LegacyCallInterceptor;
}

export interface LegacyReactOptions {
  readonly ReactModule?: ReactModuleExports;
  readonly ReactNativeModule?: ReactNativeModuleExports;
  readonly IReactModule?: LegacyReactModuleInterceptors;
  readonly IJsxRuntimeModule?: LegacyJSXRuntimeInterceptors;
  readonly enableInterceptClassComponentConstructor?: boolean;
  readonly enableInterceptClassComponentMethods?: boolean;
  readonly enableInterceptFunctionComponentRender?: boolean;
  readonly enableInterceptDomElement?: boolean;
  readonly enableInterceptComponentElement?: boolean;
  readonly enableInterceptSpecialElement?: boolean;
  readonly enableReactComponentPublisher?: boolean;
}

export interface LegacyComponentPropsOptions {
  readonly intercept?: readonly string[];
  readonly enableInterceptReactComponentProp?: boolean;
  readonly enableReactComponentPropPublisher?: boolean;
}

export interface LegacyAutoLoggingOptions {
  readonly react?: LegacyReactOptions;
  readonly props?: LegacyComponentPropsOptions | null;
  readonly componentProps?: LegacyComponentPropsOptions | null;
}

interface ComponentInfo {
  readonly name: string;
  readonly type: LegacyComponentType;
  readonly canPublishMount: boolean;
}

interface LegacyRuntime {
  active: boolean;
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly options: LegacyAutoLoggingOptions;
  readonly interceptProps: readonly string[];
  readonly slots: LegacyRuntimeSlot[];
}

interface LegacyRuntimeSlot {
  runtime: LegacyRuntime | null;
}

// TODO: Remove this compatibility adapter after WWW/AMA migrates to plugins.
const slotsByInterceptor = new WeakMap<object, LegacyRuntimeSlot>();
const wrappedHandlers = new WeakSet<LegacyHandler>();
const wrappersByHandler = new WeakMap<
  LegacyHandler,
  WeakMap<LegacyRuntimeSlot, Map<string, LegacyHandler>>
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
    const component = value as { prototype?: object & { render?: unknown } };
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
  slot: LegacyRuntimeSlot
): LegacyHandler {
  if (wrappedHandlers.has(handler)) return handler;
  let wrappersBySlot = wrappersByHandler.get(handler);
  if (wrappersBySlot == null) {
    wrappersBySlot = new WeakMap();
    wrappersByHandler.set(handler, wrappersBySlot);
  }
  let wrappers = wrappersBySlot.get(slot);
  if (wrappers == null) {
    wrappers = new Map();
    wrappersBySlot.set(slot, wrappers);
  }
  const key = `${component.type}:${component.name}:${prop}`;
  let wrapper = wrappers.get(key);
  if (wrapper == null) {
    wrapper = function (this: unknown, ...args: unknown[]) {
      const runtime = slot.runtime;
      const propOptions =
        runtime?.options.props ?? runtime?.options.componentProps;
      if (
        runtime?.active === true &&
        propOptions?.enableReactComponentPropPublisher === true
      ) {
        runtime.channel.emit('al_react_component_prop', {
          component: component.name,
          prop,
          args,
          type: component.type,
        });
      }
      return handler.apply(this, args);
    };
    wrappedHandlers.add(wrapper);
    wrappers.set(key, wrapper);
  }
  return wrapper;
}

function installMapper(
  interceptor: LegacyCallInterceptor | undefined,
  runtime: LegacyRuntime
): void {
  if (interceptor == null) return;
  let slot = slotsByInterceptor.get(interceptor);
  if (slot == null) {
    slot = { runtime };
    interceptor.onBeforeCallMapperAdd((args) =>
      instrumentLegacyArguments(args, slot as LegacyRuntimeSlot)
    );
    slotsByInterceptor.set(interceptor, slot);
  } else {
    slot.runtime = runtime;
  }
  if (!runtime.slots.includes(slot)) runtime.slots.push(slot);
}

function instrumentLegacyArguments(
  args: unknown[],
  slot: LegacyRuntimeSlot
): unknown[] {
  const runtime = slot.runtime;
  if (runtime?.active !== true) return args;
  const react = runtime.options.react;
  if (react == null) return args;
  const component = getComponentInfo(args[0], react);
  const props = args[1];
  if (component == null || typeof props !== 'object' || props == null) {
    return args;
  }
  if (
    react.enableReactComponentPublisher === true &&
    component.canPublishMount
  ) {
    runtime.channel.emit('al_react_component_mount', {
      surface: component.name,
      args: component.type === 'class' ? [] : [props],
    });
  }
  const propOptions = runtime.options.props ?? runtime.options.componentProps;
  if (propOptions?.enableInterceptReactComponentProp !== true) return args;

  let nextProps: Record<string, unknown> | null = null;
  const applicationProps = props as Record<string, unknown>;
  for (const prop of runtime.interceptProps) {
    const handler = applicationProps[prop];
    if (typeof handler !== 'function') continue;
    const wrapped = getLegacyHandler(
      handler as LegacyHandler,
      component,
      prop,
      slot
    );
    if (wrapped === handler) continue;
    nextProps ??= { ...applicationProps };
    nextProps[prop] = wrapped;
  }
  if (nextProps != null) args[1] = nextProps;
  return args;
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

export function reactNativeLegacyAutoLogging<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(
  options: LegacyAutoLoggingOptions,
  interceptProps: readonly string[]
): ALReactNativePlugin<EventMap> {
  return {
    name: 'react-native-legacy-autologging',
    install(channel) {
      const runtime: LegacyRuntime = {
        active: false,
        channel:
          channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>,
        options,
        interceptProps,
        slots: [],
      };
      try {
        const jsxRuntime = options.react?.IJsxRuntimeModule;
        installMapper(jsxRuntime?.jsx, runtime);
        installMapper(jsxRuntime?.jsxs, runtime);
        installMapper(jsxRuntime?.jsxDEV, runtime);
        installMapper(options.react?.IReactModule?.createElement, runtime);
      } catch (error) {
        for (const slot of runtime.slots) {
          if (slot.runtime === runtime) slot.runtime = null;
        }
        throw error;
      }
      return {
        start() {
          runtime.active = true;
        },
        dispose() {
          runtime.active = false;
          for (const slot of runtime.slots) {
            if (slot.runtime === runtime) slot.runtime = null;
          }
        },
      };
    },
  };
}
