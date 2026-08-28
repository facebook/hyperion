/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type { ALReactNativeEventMap } from './ALTypes';
import {
  createReactNativePlugins,
  type CompatibilityInitOptions,
} from './ALCompatibility';
import {
  dispose,
  init as initPlugins,
  isInitialized,
  type PluginInitOptions,
} from './ALPluginAutoLogging';

export type { ReactOptions } from './ALCompatibility';
export type { PluginInitOptions } from './ALPluginAutoLogging';
export type ALChannelEvent = ALReactNativeEventMap;

export type InitOptions<
  EventMap extends BaseChannelEventType = ALReactNativeEventMap
> = PluginInitOptions<EventMap> | CompatibilityInitOptions;

export function init<
  EventMap extends BaseChannelEventType = ALReactNativeEventMap
>(options: InitOptions<EventMap>): boolean {
  if (isPluginInitOptions(options)) return initPlugins(options);
  return initPlugins({
    channel: options.channel as AutoLoggingChannel<ALReactNativeEventMap>,
    plugins: createReactNativePlugins(options),
  });
}

function isPluginInitOptions<EventMap extends BaseChannelEventType>(
  options: InitOptions<EventMap>
): options is PluginInitOptions<EventMap> {
  return Object.prototype.hasOwnProperty.call(options, 'plugins');
}

export { dispose, isInitialized };
