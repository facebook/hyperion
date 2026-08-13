/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from 'hyperion-channel/src/Channel';
import {
  DEFAULT_CONFIG,
  DEFAULT_INTERCEPT_PROPS,
  type ALConfig,
} from './ALConfig';
import { getALRuntimeChannel, initALChannel } from './ALChannel';
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
  hasLegacyAutoLoggingOptions,
  installLegacyAutoLogging,
  isLegacyAutoLoggingEnabled,
  type LegacyAutoLoggingOptions,
  type LegacyComponentPropsOptions,
  type LegacyReactOptions,
} from './ALLegacyAutoLogging';

export type ALChannelEvent = ALChannelEventMap;

export interface InitOptions
  extends Partial<ALConfig>,
    LegacyAutoLoggingOptions {
  channel?: Channel<ALChannelEventMap>;
  heartbeat?:
    | false
    | {
        heartbeatInterval?: number;
        maxUserInactivityDuration?: number;
      };
  // TODO: Remove these aliases after WWW/AMA migrates to the modern config.
  react?: LegacyReactOptions;
  props?: LegacyComponentPropsOptions | null;
  componentProps?: LegacyComponentPropsOptions | null;
}

const pipedChannels = new WeakSet<object>();

export function init(options: InitOptions): void {
  if (isALRuntimeInitialized()) return;
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
  if (runtimeEnabled && heartbeatInterval !== false) {
    configureReactNativeHeartbeatEnvironment(options.react?.ReactNativeModule);
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
  if (options.channel != null && !pipedChannels.has(options.channel)) {
    (initALChannel() as Channel<ALChannelEventMap>).pipe(options.channel);
    pipedChannels.add(options.channel);
  }
}
