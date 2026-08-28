/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  type ALConfig,
  type ALFeatureConfig,
} from './ALConfig';
import { reactNativeAppLifecycle } from './ALAppLifecycle';
import { reactNativeAppStateEvents } from './ALAppStateEvents';
import { reactNativeDeepLinks } from './ALDeepLink';
import { reactNativeHeartbeat } from './ALHeartbeat';
import {
  hasLegacyAutoLoggingOptions,
  isLegacyAutoLoggingEnabled,
  reactNativeLegacyAutoLogging,
  type LegacyAutoLoggingOptions,
  type LegacyComponentPropsOptions,
  type LegacyReactOptions,
} from './ALLegacyAutoLogging';
import { reactNativeListImpressions } from './ALListViewability';
import { reactNativeReactErrors } from './ALReactError';
import type { ALReactNativePlugin } from './ALRuntime';
import { reactNativeScreens } from './ALScreen';
import { reactNativeSurfaces } from './ALSurface';
import type { ALReactNativeEventMap } from './ALTypes';
import { reactNativeUIEvents } from './ALUIEvents';
import type {
  JSXDevRuntimeModuleExports,
  JSXRuntimeModuleExports,
} from './ReactNativeElementObservation';

export interface ReactOptions extends LegacyReactOptions {
  readonly JSXRuntimeModule?: JSXRuntimeModuleExports;
  readonly JSXDevRuntimeModule?: JSXDevRuntimeModuleExports;
}

export interface CompatibilityInitOptions
  extends Partial<ALConfig>,
    LegacyAutoLoggingOptions {
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly heartbeat?:
    | false
    | {
        readonly heartbeatInterval?: number;
        readonly maxUserInactivityDuration?: number;
      };
  readonly react?: ReactOptions;
  readonly props?: LegacyComponentPropsOptions | null;
  readonly componentProps?: LegacyComponentPropsOptions | null;
  readonly features?: ALFeatureConfig;
}

export function createReactNativePlugins(
  options: Omit<CompatibilityInitOptions, 'channel'>
): readonly ALReactNativePlugin<ALReactNativeEventMap>[] {
  const hasLegacyOptions = hasLegacyAutoLoggingOptions(options);
  const legacyEnabled = isLegacyAutoLoggingEnabled(options);
  const runtimeEnabled =
    options.enabled ?? (!hasLegacyOptions || legacyEnabled);
  if (!runtimeEnabled) return [];

  const enabledByDefault = !hasLegacyOptions;
  const featureEnabled = (feature: keyof ALFeatureConfig): boolean =>
    options.features?.[feature] ?? enabledByDefault;
  const plugins: ALReactNativePlugin<ALReactNativeEventMap>[] = [];
  const automaticUIEvents = featureEnabled('automaticUIEvents');
  const surfaceMutationEvents = featureEnabled('surfaceMutationEvents');
  const screenTransitionEvents = featureEnabled('screenTransitionEvents');
  const propOptions = options.props ?? options.componentProps;
  const interceptProps =
    options.interceptProps ?? propOptions?.intercept ?? DEFAULT_INTERCEPT_PROPS;

  plugins.push(
    reactNativeSurfaces({ publishMutations: surfaceMutationEvents })
  );
  if (automaticUIEvents) {
    const react = options.react;
    plugins.push(
      reactNativeUIEvents({
        ReactModule: react?.ReactModule,
        JSXRuntimeModule: react?.JSXRuntimeModule,
        JSXDevRuntimeModule: react?.JSXDevRuntimeModule,
        interceptProps,
        componentNameValidator: options.componentNameValidator,
        debug: options.debug ?? DEFAULT_CONFIG.debug,
      })
    );
  }

  const heartbeatOptions =
    options.heartbeat === false ? null : options.heartbeat;
  const heartbeatInterval =
    options.heartbeat === false
      ? false
      : options.heartbeatInterval ??
        heartbeatOptions?.heartbeatInterval ??
        (hasLegacyOptions ? false : DEFAULT_CONFIG.heartbeatInterval);
  if (heartbeatInterval !== false) {
    const AppState = options.react?.ReactNativeModule?.AppState;
    if (AppState == null) {
      throw new Error(
        'Heartbeat requires react.ReactNativeModule.AppState configuration.'
      );
    }
    plugins.push(
      reactNativeAppLifecycle({ AppState }),
      reactNativeHeartbeat({
        heartbeatInterval,
        maxUserInactivityDuration:
          options.maxUserInactivityDuration ??
          heartbeatOptions?.maxUserInactivityDuration,
      }),
      reactNativeAppStateEvents()
    );
  }

  plugins.push(
    reactNativeScreens({ publishTransitions: screenTransitionEvents })
  );
  if (featureEnabled('listImpressionEvents')) {
    plugins.push(reactNativeListImpressions());
  }
  if (featureEnabled('deepLinkEvents')) {
    plugins.push(reactNativeDeepLinks());
  }
  if (featureEnabled('reactErrorEvents')) {
    plugins.push(reactNativeReactErrors());
  }
  if (hasLegacyOptions && legacyEnabled) {
    plugins.push(reactNativeLegacyAutoLogging(options, interceptProps));
  }
  return plugins;
}
