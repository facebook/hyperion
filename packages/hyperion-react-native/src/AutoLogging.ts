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
} from './ALRuntime';
import type { ALReactNativeEventMap } from './ALTypes';

export interface InitOptions<
  EventMap extends BaseChannelEventType = ALReactNativeEventMap
> {
  readonly channel: AutoLoggingChannel<EventMap>;
  readonly plugins: readonly ALReactNativePlugin<EventMap>[];
}

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
    const runtime = createReactNativeRuntime(options);
    activeRuntime =
      runtime as unknown as ALReactNativeRuntime<BaseChannelEventType>;
    setActiveRuntimeContext(runtime.context);
    initializationState = 'initialized';
    return true;
  } catch (error) {
    initializationState = 'idle';
    throw error;
  }
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
