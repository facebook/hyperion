/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import {
  getAppInstanceId,
  getNextEventIndex,
  getScreenId,
  getSessionId,
} from './ALSession';
import { getCurrentScreen } from './ALScreen';
import type {
  ALLoggableEvent,
  ALMobileEventContext,
  ALTransportEnvelope,
} from './ALTypes';

export function setIfDefined(
  target: object,
  key: string,
  value: unknown
): void {
  if (value != null) (target as Record<string, unknown>)[key] = value;
}

export function createLoggableEvent(
  eventTimestamp = Date.now(),
  relatedEventIndex?: number
): ALLoggableEvent {
  getSessionId(eventTimestamp);
  const event = {
    eventTimestamp,
    eventIndex: getNextEventIndex(),
    metadata: {},
  };
  setIfDefined(event, 'relatedEventIndex', relatedEventIndex);
  return event;
}

export function getMobileEventContext(appName: string): ALMobileEventContext {
  const sessionId = getSessionId();
  const appInstanceId = getAppInstanceId();
  const screenId = getScreenId();
  const screen = getCurrentScreen()?.name;
  const context = {
    appName,
    appSessionId: `${sessionId}:${appInstanceId}:${screenId}`,
    sessionId,
    appInstanceId,
    screenId,
  };
  setIfDefined(context, 'screen', screen);
  return context;
}

export function createTransportEnvelope<Event extends ALLoggableEvent>(
  family: string,
  event: Event,
  appName: string
): ALTransportEnvelope<Event> {
  return {
    family,
    event,
    context: getMobileEventContext(appName),
  };
}
