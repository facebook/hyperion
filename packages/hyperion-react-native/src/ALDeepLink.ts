/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { mergeMetadata } from './ALMetadata';
import type {
  ALReactNativePlugin,
  ALReactNativeRuntimeContext,
} from './ALRuntime';
import type {
  ALDeepLinkEventData,
  ALDeepLinkSource,
  ALReactNativeEventMap,
  SurfaceMetadata,
} from './ALTypes';

interface DeepLinkRuntime {
  active: boolean;
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly context: ALReactNativeRuntimeContext;
}

let deepLinkRuntime: DeepLinkRuntime | null = null;

export function reactNativeDeepLinks<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(): ALReactNativePlugin<EventMap> {
  return {
    name: 'react-native-deep-links',
    install(channel, context) {
      const runtime: DeepLinkRuntime = {
        active: false,
        channel:
          channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>,
        context,
      };
      deepLinkRuntime = runtime;
      return {
        start() {
          runtime.active = true;
        },
        dispose() {
          runtime.active = false;
          if (deepLinkRuntime === runtime) deepLinkRuntime = null;
        },
      };
    },
  };
}

export interface ALDeepLinkOptions {
  readonly source: ALDeepLinkSource;
  readonly metadata?: SurfaceMetadata;
}

export function logDeepLinkOpen(
  targetURI: string,
  options: ALDeepLinkOptions
): boolean {
  const runtime = deepLinkRuntime;
  if (
    runtime?.active !== true ||
    targetURI.length === 0 ||
    !isDeepLinkSource(options.source)
  ) {
    return false;
  }
  try {
    const event: ALDeepLinkEventData = {
      ...runtime.context.eventFactory.createEvent({
        metadata: mergeMetadata(options.metadata),
      }),
      event: 'deep_link_open',
      source: options.source,
      targetURI,
    };
    runtime.channel.emit('al_deep_link_event', event);
  } catch {
    return false;
  }
  return true;
}

function isDeepLinkSource(value: unknown): value is ALDeepLinkSource {
  return (
    value === 'initial_url' || value === 'url_event' || value === 'notification'
  );
}
