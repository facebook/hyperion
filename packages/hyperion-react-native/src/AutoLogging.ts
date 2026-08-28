/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import {
  clearActiveRuntimeContext,
  setActiveRuntimeContext,
} from './ALActiveRuntime';
import {
  createReactNativeRuntime,
  type ALReactNativePlugin,
  type ALReactNativeRuntime,
  type ALReactNativeRuntimeOptions,
} from './ALRuntime';
import type { ALReactNativeEventMap } from './ALTypes';
import {
  createReactNativePlugins,
  type CompatibilityInitOptions,
} from './ALCompatibility';

export type { ReactOptions } from './ALCompatibility';
export type ALChannelEvent = ALReactNativeEventMap;

export interface PluginInitOptions<
  EventMap extends BaseChannelEventType = ALReactNativeEventMap
> {
  readonly channel: AutoLoggingChannel<EventMap>;
  readonly plugins: readonly ALReactNativePlugin<EventMap>[];
}

export type InitOptions<
  EventMap extends BaseChannelEventType = ALReactNativeEventMap
> = PluginInitOptions<EventMap> | CompatibilityInitOptions;

type InitializationState =
  | 'idle'
  | 'initializing'
  | 'initialized'
  | 'disposing';

let initializationState: InitializationState = 'idle';
let activeRuntime: ALReactNativeRuntime<BaseChannelEventType> | null = null;

export function init<
  EventMap extends BaseChannelEventType = ALReactNativeEventMap
>(options: InitOptions<EventMap>): boolean {
  if (initializationState !== 'idle') return false;
  if (options.channel == null) {
    throw new Error('AutoLogging.init requires an application-owned channel.');
  }
  initializationState = 'initializing';
  try {
    const runtimeOptions = isPluginInitOptions(options)
      ? options
      : {
          channel: options.channel,
          plugins: createReactNativePlugins(options),
        };
    const runtime = createReactNativeRuntime(
      runtimeOptions as unknown as ALReactNativeRuntimeOptions<BaseChannelEventType>
    );
    activeRuntime = runtime;
    setActiveRuntimeContext(runtime.context);
    initializationState = 'initialized';
    return true;
  } catch (error) {
    initializationState = 'idle';
    throw error;
  }
}

function isPluginInitOptions<EventMap extends BaseChannelEventType>(
  options: InitOptions<EventMap>
): options is PluginInitOptions<EventMap> {
  return Object.prototype.hasOwnProperty.call(options, 'plugins');
}

export function dispose(): boolean {
  const runtime = activeRuntime;
  if (initializationState !== 'initialized' || runtime == null) return false;
  initializationState = 'disposing';
  try {
    return runtime.dispose();
  } finally {
    clearActiveRuntimeContext(runtime.context);
    activeRuntime = null;
    initializationState = 'idle';
  }
}

export function isInitialized(): boolean {
  return initializationState === 'initialized';
}
