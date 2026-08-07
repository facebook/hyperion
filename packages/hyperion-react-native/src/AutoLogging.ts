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
import { initALChannel } from './ALChannel';
import { startHeartbeat } from './ALHeartbeat';
import { initializeAutoLogging, isALRuntimeEnabled } from './ALRuntime';
import type { ALChannelEventMap } from './ALTypes';

export type ALChannelEvent = ALChannelEventMap;

export interface InitOptions extends Partial<ALConfig> {
  channel?: Channel<ALChannelEventMap>;
  heartbeat?:
    | false
    | {
        heartbeatInterval?: number;
        maxUserInactivityDuration?: number;
      };
  react?: {
    enableInterceptComponentElement?: boolean;
  };
  props?: {
    intercept?: readonly string[];
    enableInterceptReactComponentProp?: boolean;
  } | null;
  componentProps?: {
    intercept?: readonly string[];
    enableInterceptReactComponentProp?: boolean;
  } | null;
}

const pipedChannels = new WeakSet<object>();

export function init(options: InitOptions): void {
  const propOptions = options.props ?? options.componentProps;
  const hasLegacyOptions =
    options.react != null ||
    options.props !== undefined ||
    options.componentProps !== undefined;
  const legacyEnabled =
    !hasLegacyOptions ||
    options.react?.enableInterceptComponentElement === true ||
    propOptions?.enableInterceptReactComponentProp === true;
  const heartbeatOptions =
    options.heartbeat === false ? null : options.heartbeat;
  const heartbeatInterval =
    options.heartbeat === false
      ? false
      : options.heartbeatInterval ??
        heartbeatOptions?.heartbeatInterval ??
        DEFAULT_CONFIG.heartbeatInterval;
  const maxUserInactivityDuration =
    options.maxUserInactivityDuration ??
    heartbeatOptions?.maxUserInactivityDuration;
  initializeAutoLogging({
    appName: options.appName ?? 'react_native',
    enabled: options.enabled ?? legacyEnabled,
    heartbeatInterval,
    maxUserInactivityDuration,
    interceptProps:
      options.interceptProps ??
      propOptions?.intercept ??
      DEFAULT_INTERCEPT_PROPS,
    debug: options.debug ?? DEFAULT_CONFIG.debug,
    componentNameValidator: options.componentNameValidator,
    features: options.features,
  });
  if (heartbeatInterval !== false && isALRuntimeEnabled()) {
    startHeartbeat(heartbeatInterval, maxUserInactivityDuration);
  }
  if (options.channel != null && !pipedChannels.has(options.channel)) {
    (initALChannel() as Channel<ALChannelEventMap>).pipe(options.channel);
    pipedChannels.add(options.channel);
  }
}
