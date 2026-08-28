/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type {
  ALCreateEventOptions,
  ALEventFactory,
} from 'hyperion-autologging/src/ALEventFactory';
import { createALEventFactory } from 'hyperion-autologging/src/ALEventFactory';
import type { ALManagedPlugin } from 'hyperion-autologging/src/ALPlugin';
import { ALPluginRuntime } from 'hyperion-autologging/src/ALPluginRuntime';
import { ALReactNativeSession } from './ALSession';
import type { ALLoggableEvent, SurfaceMetadataValue } from './ALTypes';

export interface ALReactNativeRuntimeContext {
  readonly eventFactory: ALEventFactory<SurfaceMetadataValue>;
  readonly session: ALReactNativeSession;
  readonly now: () => number;
}

export type ALReactNativePlugin<EventMap extends BaseChannelEventType> =
  ALManagedPlugin<EventMap, ALReactNativeRuntimeContext>;

export interface ALReactNativeRuntimeOptions<
  EventMap extends BaseChannelEventType
> {
  readonly channel: AutoLoggingChannel<EventMap>;
  readonly plugins: readonly ALReactNativePlugin<EventMap>[];
  readonly now?: () => number;
}

export interface ALReactNativeRuntime<EventMap extends BaseChannelEventType> {
  readonly channel: AutoLoggingChannel<EventMap>;
  readonly context: ALReactNativeRuntimeContext;
  isInitialized(): boolean;
  dispose(): boolean;
}

function createRuntimeContext(now: () => number): ALReactNativeRuntimeContext {
  const session = new ALReactNativeSession(now);
  const factory = createALEventFactory<SurfaceMetadataValue>({
    now,
    nextEventIndex: () => session.nextEventIndex(),
    getBaseMetadata: () => ({}),
  });
  const eventFactory: ALEventFactory<SurfaceMetadataValue> = {
    createEvent(options?: ALCreateEventOptions<SurfaceMetadataValue>) {
      const eventTimestamp = options?.eventTimestamp ?? now();
      session.getSessionId(eventTimestamp);
      return factory.createEvent({ ...options, eventTimestamp });
    },
  };
  return { eventFactory, session, now };
}

export function createReactNativeRuntime<EventMap extends BaseChannelEventType>(
  options: ALReactNativeRuntimeOptions<EventMap>
): ALReactNativeRuntime<EventMap> {
  const context = createRuntimeContext(options.now ?? Date.now);
  const runtime = new ALPluginRuntime(options.channel, context);
  runtime.initialize(options.plugins);
  return {
    channel: options.channel,
    context,
    isInitialized: () => runtime.isInitialized(),
    dispose: () => runtime.dispose(),
  };
}

export function createLoggableEvent(
  context: ALReactNativeRuntimeContext,
  options?: ALCreateEventOptions<SurfaceMetadataValue>
): ALLoggableEvent {
  return context.eventFactory.createEvent(options);
}
