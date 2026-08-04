/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { AppState } from 'react-native';
import { ALHeartbeatType } from 'hyperion-autologging-shared';
import { getALRuntimeChannel } from './ALChannel';

export { ALHeartbeatType } from 'hyperion-autologging-shared';

export interface ALHeartbeatEnvironment {
  getCurrentState(): string;
  addStateListener(listener: (state: string) => void): { remove(): void };
  setInterval(
    callback: () => void,
    interval: number
  ): ReturnType<typeof setInterval>;
  clearInterval(handle: ReturnType<typeof setInterval>): void;
  now(): number;
}

const defaultEnvironment: ALHeartbeatEnvironment = {
  getCurrentState: () => AppState.currentState,
  addStateListener: (listener) => AppState.addEventListener('change', listener),
  setInterval: (callback, interval) => setInterval(callback, interval),
  clearInterval: (handle) => clearInterval(handle),
  now: () => Date.now(),
};

let environment = defaultEnvironment;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let lastActivityTime = Date.now();
let lastHeartbeatTime = 0;
let heartbeatIntervalMs = 30_000;
let maxInactivityMs = 120_000;
let appStateSubscription: { remove(): void } | null = null;
let uiEventListener: ((event: { eventTimestamp: number }) => void) | null =
  null;
let lastAppState: string | null = null;

function emitHeartbeat(type: ALHeartbeatType): void {
  const timestamp = environment.now();
  if (timestamp - lastActivityTime > maxInactivityMs) return;
  const channel = getALRuntimeChannel();
  if (channel == null) return;
  channel.emitSafely('al_heartbeat_request', { type, timestamp });
  lastHeartbeatTime = timestamp;
}

function startInterval(): void {
  if (intervalHandle != null) return;
  intervalHandle = environment.setInterval(
    () => emitHeartbeat(ALHeartbeatType.SCHEDULED),
    heartbeatIntervalMs
  );
}

function stopInterval(): void {
  if (intervalHandle == null) return;
  environment.clearInterval(intervalHandle);
  intervalHandle = null;
}

export function recordActivity(timestamp = environment.now()): void {
  lastActivityTime = timestamp;
}

export function startHeartbeat(
  intervalMs = 30_000,
  maximumInactivityMs?: number
): void {
  if (appStateSubscription != null) return;
  heartbeatIntervalMs = intervalMs;
  maxInactivityMs = maximumInactivityMs ?? intervalMs * 4;
  lastAppState = environment.getCurrentState();
  recordActivity();
  const channel = getALRuntimeChannel();
  if (channel != null) {
    uiEventListener = (event) => recordActivity(event.eventTimestamp);
    channel.addListener('al_ui_event', uiEventListener);
  }
  emitHeartbeat(ALHeartbeatType.START);
  if (lastAppState !== 'background' && lastAppState !== 'inactive') {
    startInterval();
  }
  appStateSubscription = environment.addStateListener((state) => {
    const timestamp = environment.now();
    const previousState = lastAppState;
    lastAppState = state;
    if (state === 'active') {
      recordActivity(timestamp);
      emitHeartbeat(
        timestamp - lastHeartbeatTime >= heartbeatIntervalMs
          ? ALHeartbeatType.REGAIN_PAGE_VISIBILITY
          : ALHeartbeatType.PAGE_FOCUS_GAINED
      );
      startInterval();
    } else {
      if (previousState === 'active') {
        emitHeartbeat(ALHeartbeatType.PAGE_FOCUS_LOST);
      }
      stopInterval();
    }
    channel?.emitSafely('al_app_state_request', { state, timestamp });
  });
}

export function stopHeartbeat(): void {
  if (intervalHandle == null && appStateSubscription == null) return;
  emitHeartbeat(ALHeartbeatType.STOP);
  stopInterval();
  appStateSubscription?.remove();
  appStateSubscription = null;
  const channel = getALRuntimeChannel();
  if (channel != null && uiEventListener != null) {
    channel.removeListener('al_ui_event', uiEventListener);
  }
  uiEventListener = null;
  lastAppState = null;
}

export function setHeartbeatEnvironmentForTests(
  nextEnvironment: ALHeartbeatEnvironment
): void {
  stopHeartbeat();
  environment = nextEnvironment;
}

export function resetHeartbeatEnvironmentForTests(): void {
  stopHeartbeat();
  environment = defaultEnvironment;
  lastHeartbeatTime = 0;
  lastActivityTime = environment.now();
}
