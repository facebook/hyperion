/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type {Channel} from 'hyperion-channel/src/Channel';
import {DEFAULT_CONFIG, DEFAULT_INTERCEPT_PROPS} from './ALConfig';
import {initALChannel} from './ALChannel';
import {startHeartbeat} from './ALHeartbeat';
import {
  initializeAutoLogging,
  isALRuntimeSampledIn,
} from './ALProvider';
import type {ALChannelEventMap} from './ALTypes';

'use strict';


export type ALChannelEvent = ALChannelEventMap;

export interface InitOptions {
  appName?: string;
  sampleRate?: number;
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
  const enabled =
    options.react?.enableInterceptComponentElement !== false ||
    propOptions?.enableInterceptReactComponentProp !== false;
  const heartbeatOptions =
    options.heartbeat === false ? null : options.heartbeat ?? {};
  const heartbeatInterval =
    heartbeatOptions?.heartbeatInterval ?? DEFAULT_CONFIG.heartbeatInterval;
  initializeAutoLogging({
    appName: options.appName ?? 'react_native',
    enabled,
    sampleRate: options.sampleRate ?? 1,
    heartbeatInterval:
      heartbeatOptions == null ? false : heartbeatInterval,
    maxUserInactivityDuration:
      heartbeatOptions?.maxUserInactivityDuration,
    interceptProps: propOptions?.intercept ?? DEFAULT_INTERCEPT_PROPS,
    debug: false,
  });
  if (
    heartbeatOptions != null &&
    isALRuntimeSampledIn()
  ) {
    startHeartbeat(
      heartbeatInterval,
      heartbeatOptions.maxUserInactivityDuration,
    );
  }
  if (options.channel != null && !pipedChannels.has(options.channel)) {
    (initALChannel() as Channel<ALChannelEventMap>).pipe(options.channel);
    pipedChannels.add(options.channel);
  }
}
