/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import type {
  ALReactNativePlugin,
  ALReactNativeRuntimeContext,
} from './ALRuntime';
import type { ALReactErrorEventData, ALReactNativeEventMap } from './ALTypes';

interface ReactErrorRuntime {
  active: boolean;
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly context: ALReactNativeRuntimeContext;
}

let reactErrorRuntime: ReactErrorRuntime | null = null;

export function reactNativeReactErrors<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(): ALReactNativePlugin<EventMap> {
  return {
    name: 'react-native-react-errors',
    install(channel, context) {
      const runtime: ReactErrorRuntime = {
        active: false,
        channel:
          channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>,
        context,
      };
      reactErrorRuntime = runtime;
      return {
        start() {
          runtime.active = true;
        },
        dispose() {
          runtime.active = false;
          if (reactErrorRuntime === runtime) reactErrorRuntime = null;
        },
      };
    },
  };
}

export interface ALReactErrorInfo {
  readonly componentStack?: string | null;
}

export interface ALReactErrorOptions {
  readonly boundaryName?: string;
  readonly errorCategory?: string;
}

export function logReactErrorBoundary(
  error: unknown,
  info: ALReactErrorInfo,
  options: ALReactErrorOptions = {}
): boolean {
  const runtime = reactErrorRuntime;
  if (runtime?.active !== true) return false;
  try {
    const errorObject =
      typeof error === 'object' && error != null
        ? (error as { message?: unknown; name?: unknown; stack?: unknown })
        : null;
    const event = {
      ...runtime.context.eventFactory.createEvent(),
      event: 'error' as const,
      source: 'react_error_boundary' as const,
      errorName:
        typeof errorObject?.name === 'string' ? errorObject.name : 'Error',
    };
    setIfString(event, 'errorMessage', errorObject?.message);
    setIfString(event, 'errorStack', errorObject?.stack);
    setIfString(event, 'boundaryName', options.boundaryName);
    setIfString(event, 'errorCategory', options.errorCategory);
    setIfString(event, 'reactComponentStack', info.componentStack);
    runtime.channel.emit(
      'al_react_error_event',
      event as ALReactErrorEventData
    );
  } catch {
    return false;
  }
  return true;
}

function setIfString(target: object, key: string, value: unknown): void {
  if (typeof value === 'string') {
    (target as Record<string, unknown>)[key] = value;
  }
}

export default Object.freeze({
  logReactErrorBoundary,
  reactNativeReactErrors,
});
