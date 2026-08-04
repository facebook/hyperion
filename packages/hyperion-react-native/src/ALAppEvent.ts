/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { useCallback } from 'react';
import { getALRuntimeChannel } from './ALChannel';
import { isALRuntimeEnabled } from './ALRuntime';
import { useSurface } from './ALSurface';
import type { ALCustomEventLevel, SurfaceMetadata } from './ALTypes';

const EVENT_NAME_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)?$/;
const MAX_EVENT_NAME_LENGTH = 96;

export function isValidAppEventName(eventName: string): boolean {
  return (
    eventName.length <= MAX_EVENT_NAME_LENGTH && EVENT_NAME_RE.test(eventName)
  );
}

export function logAppEvent(
  eventName: string,
  attributes?: Readonly<Record<string, unknown>>,
  level: ALCustomEventLevel = 'info'
): void {
  emitAppEvent(eventName, attributes, level);
}

export function useLogAppEvent(): typeof logAppEvent {
  const surface = useSurface();
  return useCallback(
    (eventName, attributes, level = 'info') =>
      emitAppEvent(
        eventName,
        attributes,
        level,
        surface?.interactivePath || undefined,
        surface?.interactiveMetadata
      ),
    [surface]
  );
}

function emitAppEvent(
  eventName: string,
  attributes?: Readonly<Record<string, unknown>>,
  level: ALCustomEventLevel = 'info',
  surface?: string,
  surfaceMetadata?: SurfaceMetadata
): void {
  if (!isALRuntimeEnabled() || !isValidAppEventName(eventName)) return;
  const channel = getALRuntimeChannel();
  if (channel == null) return;
  channel.emitSafely('al_custom_event_request', {
    eventName,
    level,
    attributes,
    surface,
    surfaceMetadata,
  });
}
