/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getActiveRuntimeContext } from './ALActiveRuntime';

function getSession() {
  const session = getActiveRuntimeContext()?.session;
  if (session == null) {
    throw new Error('React Native AutoLogging is not initialized.');
  }
  return session;
}

export function getSessionId(): string {
  return getSession().getSessionId();
}

export function getAppInstanceId(): string {
  return getSession().getAppInstanceId();
}

export function getScreenId(): string {
  return getSession().getScreenId();
}

export function getWebSessionId(): string {
  const session = getSession();
  return `${session.getSessionId()}:${session.getAppInstanceId()}:${session.getScreenId()}`;
}

export function extendSession(timestamp?: number): void {
  getSession().recordActivity(timestamp);
}

export function recordActivity(timestamp?: number): void {
  extendSession(timestamp);
}

export function rotateScreenId(): void {
  getSession().rotateScreenId();
}
