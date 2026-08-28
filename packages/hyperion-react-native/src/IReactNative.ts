/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export type AppStateStatus =
  | 'active'
  | 'background'
  | 'inactive'
  | 'unknown'
  | 'extension';

export interface ReactNativeAppStateSubscription {
  remove(): void;
}

export interface ReactNativeAppState {
  readonly currentState: AppStateStatus | null;
  addEventListener(
    type: 'change',
    listener: (state: AppStateStatus) => void
  ): ReactNativeAppStateSubscription;
}

export interface ReactNativeModuleExports {
  readonly AppState: ReactNativeAppState;
}

export type ALAppStateListener = (
  state: AppStateStatus,
  previousState: AppStateStatus | null,
  timestamp: number
) => void;

export interface ALAppLifecycleEnvironment {
  getCurrentState(): AppStateStatus | null;
  addListener(listener: ALAppStateListener): () => void;
  start(): void;
  dispose(): void;
}
