/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ALHeartbeatType } from 'hyperion-autologging-shared';
import { getALRuntimeChannel } from './ALChannel';
import type { AppStateStatus, ReactNativeModuleExports } from './IReactNative';

export { ALHeartbeatType } from 'hyperion-autologging-shared';

export interface ALHeartbeatEnvironment {
  getCurrentState(): AppStateStatus | null;
  addStateListener(listener: (state: AppStateStatus) => void): {
    remove(): void;
  };
  setInterval(
    callback: () => void,
    interval: number
  ): ReturnType<typeof setInterval>;
  clearInterval(handle: ReturnType<typeof setInterval>): void;
  now(): number;
}

const defaultTimingEnvironment: Pick<
  ALHeartbeatEnvironment,
  'setInterval' | 'clearInterval' | 'now'
> = {
  setInterval: (callback, interval) => setInterval(callback, interval),
  clearInterval: (handle) => clearInterval(handle),
  now: () => Date.now(),
};

let environment: ALHeartbeatEnvironment | null = null;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let lastActivityTime = Date.now();
let lastHeartbeatTime = 0;
let heartbeatIntervalMs = 30_000;
let maxInactivityMs = 120_000;
let appStateSubscription: { remove(): void } | null = null;
let uiEventListener: ((event: { eventTimestamp: number }) => void) | null =
  null;
let lastAppState: AppStateStatus | null = null;

function getEnvironment(): ALHeartbeatEnvironment {
  if (environment == null) {
    throw new Error(
      'Heartbeat requires react.ReactNativeModule.AppState configuration'
    );
  }
  return environment;
}

export function configureReactNativeHeartbeatEnvironment(
  reactNativeModule: ReactNativeModuleExports | undefined
): void {
  const appState = reactNativeModule?.AppState;
  if (appState == null) {
    throw new Error(
      'Heartbeat requires react.ReactNativeModule.AppState configuration'
    );
  }
  environment = {
    getCurrentState: () => appState.currentState,
    addStateListener: (listener) =>
      appState.addEventListener('change', listener),
    ...defaultTimingEnvironment,
  };
}

function emitHeartbeat(type: ALHeartbeatType): void {
  const timestamp = getEnvironment().now();
  if (timestamp - lastActivityTime > maxInactivityMs) return;
  const channel = getALRuntimeChannel();
  if (channel == null) return;
  channel.emitSafely('al_heartbeat_request', { type, timestamp });
  lastHeartbeatTime = timestamp;
}

function startInterval(): void {
  if (intervalHandle != null) return;
  intervalHandle = getEnvironment().setInterval(
    () => emitHeartbeat(ALHeartbeatType.SCHEDULED),
    heartbeatIntervalMs
  );
}

function stopInterval(): void {
  if (intervalHandle == null) return;
  getEnvironment().clearInterval(intervalHandle);
  intervalHandle = null;
}

export function recordActivity(
  timestamp = environment?.now() ?? Date.now()
): void {
  lastActivityTime = timestamp;
}

export function startHeartbeat(
  intervalMs = 30_000,
  maximumInactivityMs?: number
): void {
  if (appStateSubscription != null) return;
  const heartbeatEnvironment = getEnvironment();
  heartbeatIntervalMs = intervalMs;
  maxInactivityMs = maximumInactivityMs ?? intervalMs * 4;
  lastAppState = heartbeatEnvironment.getCurrentState();
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
  appStateSubscription = heartbeatEnvironment.addStateListener((state) => {
    const timestamp = heartbeatEnvironment.now();
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
  environment = null;
  lastHeartbeatTime = 0;
  lastActivityTime = Date.now();
}
