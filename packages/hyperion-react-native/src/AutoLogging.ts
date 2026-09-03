/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  type ALConfig,
} from './ALConfig';
import { getALRuntimeChannel, type ALChannel } from './ALChannel';
import {
  configureReactNativeHeartbeatEnvironment,
  startHeartbeat,
} from './ALHeartbeat';
import {
  initializeAutoLogging,
  isALRuntimeEnabled,
  isALRuntimeInitialized,
} from './ALRuntime';
import type { ALChannelEventMap } from './ALTypes';
import {
  installReactNativeJSXRuntime,
  type JSXDevRuntimeModuleExports,
  type JSXRuntimeModuleExports,
} from './ReactNativeElementObservation';
import {
  hasLegacyAutoLoggingOptions,
  installLegacyAutoLogging,
  isLegacyAutoLoggingEnabled,
  type LegacyAutoLoggingOptions,
  type LegacyComponentPropsOptions,
  type LegacyReactOptions,
} from './ALLegacyAutoLogging';

export type ALChannelEvent = ALChannelEventMap;

export interface ReactOptions extends LegacyReactOptions {
  JSXRuntimeModule?: JSXRuntimeModuleExports;
  JSXDevRuntimeModule?: JSXDevRuntimeModuleExports;
}

export interface InitOptions
  extends Partial<ALConfig>,
    LegacyAutoLoggingOptions {
  channel: ALChannel;
  heartbeat?:
    | false
    | {
        heartbeatInterval?: number;
        maxUserInactivityDuration?: number;
      };
  // TODO: Remove these aliases after WWW/AMA migrates to the modern config.
  react?: ReactOptions;
  props?: LegacyComponentPropsOptions | null;
  componentProps?: LegacyComponentPropsOptions | null;
}

export function init(options: InitOptions): void {
  if (isALRuntimeInitialized()) return;
  if (options.channel == null) {
    throw new Error('AutoLogging.init requires an application-owned channel');
  }
  const propOptions = options.props ?? options.componentProps;
  const hasLegacyOptions = hasLegacyAutoLoggingOptions(options);
  const legacyEnabled = isLegacyAutoLoggingEnabled(options);
  const heartbeatOptions =
    options.heartbeat === false ? null : options.heartbeat;
  const heartbeatInterval =
    options.heartbeat === false
      ? false
      : options.heartbeatInterval ??
        heartbeatOptions?.heartbeatInterval ??
        (hasLegacyOptions ? false : DEFAULT_CONFIG.heartbeatInterval);
  const maxUserInactivityDuration =
    options.maxUserInactivityDuration ??
    heartbeatOptions?.maxUserInactivityDuration;
  const runtimeEnabled =
    options.enabled ?? (!hasLegacyOptions || legacyEnabled);
  const automaticUIEventsEnabled =
    runtimeEnabled &&
    (options.features?.automaticUIEvents ?? !hasLegacyOptions);
  if (runtimeEnabled && heartbeatInterval !== false) {
    configureReactNativeHeartbeatEnvironment(options.react?.ReactNativeModule);
  }
  const reactOptions = options.react;
  if (
    automaticUIEventsEnabled &&
    reactOptions != null &&
    (reactOptions.ReactModule != null ||
      reactOptions.JSXRuntimeModule != null ||
      reactOptions.JSXDevRuntimeModule != null)
  ) {
    installReactNativeJSXRuntime(
      reactOptions.ReactModule ?? {},
      reactOptions.JSXRuntimeModule,
      reactOptions.JSXDevRuntimeModule
    );
  }
  initializeAutoLogging(
    {
      appName: options.appName ?? 'react_native',
      enabled: runtimeEnabled,
      heartbeatInterval,
      maxUserInactivityDuration,
      interceptProps:
        options.interceptProps ??
        propOptions?.intercept ??
        DEFAULT_INTERCEPT_PROPS,
      debug: options.debug ?? DEFAULT_CONFIG.debug,
      componentNameValidator: options.componentNameValidator,
      features: options.features,
    },
    options.channel,
    !hasLegacyOptions
  );
  if (hasLegacyOptions && isALRuntimeEnabled()) {
    const runtimeChannel = getALRuntimeChannel();
    if (runtimeChannel != null) {
      installLegacyAutoLogging(
        options,
        runtimeChannel,
        options.interceptProps ??
          propOptions?.intercept ??
          DEFAULT_INTERCEPT_PROPS
      );
    }
  }
  if (heartbeatInterval !== false && isALRuntimeEnabled()) {
    startHeartbeat(heartbeatInterval, maxUserInactivityDuration);
  }
}
