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
import {getCurrentScreen} from './ALScreen';
import type {
  ALLoggableEvent,
  ALMobileEventContext,
  ALTransportEnvelope,
} from './ALTypes';

export function createLoggableEvent(
  eventTimestamp = Date.now(),
  relatedEventIndex?: number,
): ALLoggableEvent {
  getSessionId(eventTimestamp);
  return {
    eventTimestamp,
    eventIndex: getNextEventIndex(),
    metadata: {},
    ...(relatedEventIndex == null ? {} : {relatedEventIndex}),
  };
}

export function getMobileEventContext(
  appName: string,
  sampleRate: number,
): ALMobileEventContext {
  const sessionId = getSessionId();
  const appInstanceId = getAppInstanceId();
  const screenId = getScreenId();
  const screen = getCurrentScreen()?.name;
  return {
    appName,
    appSessionId: `${sessionId}:${appInstanceId}:${screenId}`,
    sessionId,
    appInstanceId,
    screenId,
    ...(screen == null ? {} : {screen}),
    sampleRate,
  };
}

export function createTransportEnvelope<Event extends ALLoggableEvent>(
  family: string,
  event: Event,
  appName: string,
  sampleRate: number,
): ALTransportEnvelope<Event> {
  return {
    family,
    event,
    context: getMobileEventContext(appName, sampleRate),
  };
}
