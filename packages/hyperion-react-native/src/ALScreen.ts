/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { getExplicitText, mergeMetadata } from './ALMetadata';
import type {
  ALReactNativePlugin,
  ALReactNativeRuntimeContext,
} from './ALRuntime';
import type {
  ALReactNativeEventMap,
  ALScreenTransitionEventData,
  SurfaceMetadata,
} from './ALTypes';

export interface ALScreenState {
  readonly name: string;
  readonly screenId: string;
}

interface ScreenRuntime {
  active: boolean;
  currentScreen: ALScreenState | null;
  readonly channel: AutoLoggingChannel<ALReactNativeEventMap>;
  readonly context: ALReactNativeRuntimeContext;
}

let screenRuntime: ScreenRuntime | null = null;

export function reactNativeScreens<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(): ALReactNativePlugin<EventMap> {
  return {
    name: 'react-native-screens',
    install(channel, context) {
      const runtime: ScreenRuntime = {
        active: false,
        currentScreen: null,
        channel:
          channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>,
        context,
      };
      screenRuntime = runtime;
      return {
        start() {
          runtime.active = true;
        },
        dispose() {
          runtime.active = false;
          runtime.currentScreen = null;
          if (screenRuntime === runtime) screenRuntime = null;
        },
      };
    },
  };
}

export function getCurrentScreen(): ALScreenState | null {
  return screenRuntime?.currentScreen ?? null;
}

export function setCurrentScreen(
  name: string,
  metadata?: SurfaceMetadata
): boolean {
  const runtime = screenRuntime;
  const explicitName = getExplicitText(name);
  if (
    runtime?.active !== true ||
    explicitName == null ||
    runtime.currentScreen?.name === explicitName
  ) {
    return false;
  }
  const { context } = runtime;
  const previousScreen = runtime.currentScreen;
  const screenId = context.session.rotateScreenId();
  runtime.currentScreen = { name: explicitName, screenId };
  const event = {
    ...context.eventFactory.createEvent({ metadata: mergeMetadata(metadata) }),
    event: 'screen_transition' as const,
    screen: explicitName,
    screenId,
  };
  setIfDefined(event, 'previousScreen', previousScreen?.name);
  setIfDefined(event, 'previousScreenId', previousScreen?.screenId);
  runtime.channel.emit(
    'al_screen_transition_event',
    event as ALScreenTransitionEventData
  );
  context.session.recordActivity();
  return true;
}

function setIfDefined(target: object, key: string, value: unknown): void {
  if (value !== undefined) (target as Record<string, unknown>)[key] = value;
}
