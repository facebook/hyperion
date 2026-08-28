/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type React from 'react';
import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  mapPropToEventType,
} from './ALConfig';
import {
  createALInstrumentedElementType,
  hasInstrumentableEventProp,
  type ReactNativeUIEventConfig,
  type ReactNativeUIEventController,
} from './ALInstrumentedElement';
import {
  extractElementInfo,
  extractElementText,
  extractLabel,
  isLoggingSuppressed,
  isTextInput,
} from './ALLabelExtraction';
import type { ALReactNativePlugin } from './ALRuntime';
import type { ALReactNativeEventMap } from './ALTypes';
import type { ElementInstrumenter } from './ReactNativeElementObservation';
import {
  createReactNativeJSXPlugin,
  type ReactNativeJSXPluginOptions,
} from './ReactNativeJSXPlugin';

export {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  extractElementInfo,
  extractElementText,
  extractLabel,
  isLoggingSuppressed,
  isTextInput,
  mapPropToEventType,
};
export type { ALConfig, ALFeature, ALFeatureConfig } from './ALConfig';
export type { RNElementInfo, RNElementText } from './ALLabelExtraction';
export type {
  JSXDevRuntimeModuleExports,
  JSXRuntimeModuleExports,
  ReactModuleExports,
} from './ReactNativeElementObservation';

export interface ReactNativeUIEventsOptions
  extends ReactNativeJSXPluginOptions {
  readonly interceptProps?: readonly string[];
  readonly componentNameValidator?: (name: string) => boolean;
  readonly debug?: boolean;
}

export function reactNativeUIEvents<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(options: ReactNativeUIEventsOptions = {}): ALReactNativePlugin<EventMap> {
  const config: ReactNativeUIEventConfig = {
    debug: options.debug === true,
    interceptProps: options.interceptProps ?? DEFAULT_INTERCEPT_PROPS,
  };
  const controller: ReactNativeUIEventController = { active: false };
  const skippedComponents = new Set([
    'View',
    'RCTView',
    'AnimatedComponent',
    'AnimatedComponentWrapper',
    'ForwardRef',
    'ForwardRef(React.Fragment)',
  ]);

  return {
    name: 'react-native-ui-events',
    install(channel, context) {
      const instrumentedTypes = new WeakMap<object, unknown>();
      const elementInstrumenter: ElementInstrumenter = (type, props) => {
        if (props == null) return null;
        if (typeof type !== 'function' && typeof type !== 'object') return null;
        if (!hasInstrumentableEventProp(props, config.interceptProps)) {
          return null;
        }
        if (isLoggingSuppressed(props)) return null;
        const componentName = resolveComponentName(type);
        if (skippedComponents.has(componentName ?? '')) return null;
        if (
          componentName != null &&
          options.componentNameValidator != null &&
          !options.componentNameValidator(componentName)
        ) {
          return null;
        }
        let instrumentedType = instrumentedTypes.get(type as object);
        if (instrumentedType == null) {
          instrumentedType = createALInstrumentedElementType({
            originalType: type as React.ElementType,
            componentName,
            config,
            channel:
              channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>,
            context,
            controller,
          });
          instrumentedTypes.set(type as object, instrumentedType);
        }
        return { type: instrumentedType };
      };
      const observationLifecycle = createReactNativeJSXPlugin<EventMap>(
        options,
        elementInstrumenter,
        'react-native-ui-events-observation'
      ).install(channel, context);
      return {
        start() {
          controller.active = true;
          observationLifecycle?.start?.();
        },
        dispose() {
          controller.active = false;
          observationLifecycle?.dispose?.();
        },
      };
    },
  };
}

export function resolveComponentName(type: unknown): string | undefined {
  if (typeof type === 'function') {
    const component = type as { displayName?: string; name?: string };
    return component.displayName ?? component.name ?? undefined;
  }
  if (typeof type === 'object' && type != null) {
    const component = type as {
      type?: unknown;
      render?: ((...args: never[]) => unknown) & {
        displayName?: string;
        name?: string;
      };
      displayName?: string;
    };
    if (component.type != null) {
      const nested = resolveComponentName(component.type);
      if (nested != null) return nested;
    }
    if (typeof component.render === 'function') {
      return component.render.displayName ?? component.render.name ?? undefined;
    }
    return component.displayName;
  }
  return undefined;
}

export default Object.freeze({
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  extractElementInfo,
  extractElementText,
  extractLabel,
  isLoggingSuppressed,
  isTextInput,
  mapPropToEventType,
  reactNativeUIEvents,
});
