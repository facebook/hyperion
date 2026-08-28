/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { guid } from 'hyperion-util/src/guid';

const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
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

export class ALReactNativeSession {
  private sessionId = generateId();
  private readonly appInstanceId = generateId();
  private screenId = generateId();
  private lastActivityTime: number;
  private eventIndex = 0;

  constructor(
    private readonly now: () => number = Date.now,
    private readonly sessionTimeoutMs = DEFAULT_SESSION_TIMEOUT_MS
  ) {
    this.lastActivityTime = now();
  }

  getSessionId(timestamp = this.now()): string {
    if (timestamp - this.lastActivityTime > this.sessionTimeoutMs) {
      this.sessionId = generateId();
      this.eventIndex = 0;
      this.lastActivityTime = timestamp;
    }
    return this.sessionId;
  }

  getAppInstanceId(): string {
    return this.appInstanceId;
  }

  getScreenId(): string {
    return this.screenId;
  }

  rotateScreenId(): string {
    this.screenId = generateId();
    return this.screenId;
  }

  recordActivity(timestamp = this.now()): void {
    this.lastActivityTime = timestamp;
  }

  getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  nextEventIndex(): number {
    return this.eventIndex++;
  }
}
