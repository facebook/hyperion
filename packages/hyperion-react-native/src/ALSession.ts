/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import {guid} from 'hyperion-util/src/guid';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ID_LENGTH = 6;
const ID_SPACE = 36 ** ID_LENGTH;

function generateId(): string {
  const entropy = guid()
    .slice(1)
    .replace(/[^0-9a-f]/gi, '')
    .slice(-8);
  const randomValue = Number.parseInt(entropy, 16) || 0;
  return (randomValue % ID_SPACE).toString(36).padStart(ID_LENGTH, '0');
}

let sessionId = generateId();
let appInstanceId = generateId();
let screenId = generateId();
let lastActivityTime = Date.now();
let eventIndex = 0;

export function getSessionId(now = Date.now()): string {
  if (now - lastActivityTime > SESSION_TIMEOUT_MS) {
    sessionId = generateId();
    eventIndex = 0;
    lastActivityTime = now;
  }
  return sessionId;
}

export function getAppInstanceId(): string {
  return appInstanceId;
}

export function getScreenId(): string {
  return screenId;
}

export function getWebSessionId(): string {
  return `${getSessionId()}:${appInstanceId}:${screenId}`;
}

export function extendSession(timestamp = Date.now()): void {
  lastActivityTime = timestamp;
}

export function rotateScreenId(): void {
  screenId = generateId();
}

export function getNextEventIndex(): number {
  return eventIndex++;
}

export function resetSessionForTests(): void {
  sessionId = generateId();
  appInstanceId = generateId();
  screenId = generateId();
  lastActivityTime = Date.now();
  eventIndex = 0;
}
