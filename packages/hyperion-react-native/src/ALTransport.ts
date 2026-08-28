/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getActiveRuntimeContext } from './ALActiveRuntime';
import { getCurrentScreen } from './ALScreen';
import type {
  ALLoggableEvent,
  ALMobileEventContext,
  ALTransportEnvelope,
} from './ALTypes';

export function getMobileEventContext(appName: string): ALMobileEventContext {
  const context = getActiveRuntimeContext();
  if (context == null) {
    throw new Error('React Native AutoLogging is not initialized.');
  }
  const sessionId = context.session.getSessionId();
  const appInstanceId = context.session.getAppInstanceId();
  const screenId = context.session.getScreenId();
  const screen = getCurrentScreen()?.name;
  return {
    appName,
    appSessionId: `${sessionId}:${appInstanceId}:${screenId}`,
    sessionId,
    appInstanceId,
    screenId,
    ...(screen == null ? {} : { screen }),
  };
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

export default Object.freeze({
  createTransportEnvelope,
  getMobileEventContext,
});
