/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { ALReactNativePlugin } from './ALRuntime';
import type { ALReactNativeEventMap } from './ALTypes';
import type {
  ALAppLifecycleEnvironment,
  ALAppStateListener,
  AppStateStatus,
  ReactNativeAppState,
} from './IReactNative';

export type { ALAppStateListener } from './IReactNative';

export const REACT_NATIVE_APP_LIFECYCLE_PLUGIN = 'react-native-app-lifecycle';

export class ALAppLifecycle implements ALAppLifecycleEnvironment {
  private currentState: AppStateStatus | null = null;
  private readonly listeners = new Set<ALAppStateListener>();
  private subscription: { remove(): void } | null = null;

  constructor(
    private readonly appState: ReactNativeAppState,
    private readonly now: () => number
  ) {}

  getCurrentState(): AppStateStatus | null {
    return this.currentState;
  }

  addListener(listener: ALAppStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.subscription != null) return;
    this.currentState = this.appState.currentState;
    this.subscription = this.appState.addEventListener('change', (state) => {
      const previousState = this.currentState;
      this.currentState = state;
      const timestamp = this.now();
      const listenerCount = this.listeners.size;
      let visited = 0;
      for (const listener of this.listeners) {
        if (visited++ >= listenerCount) break;
        try {
          listener(state, previousState, timestamp);
        } catch {
          // One lifecycle capability must not block the others or AppState.
        }
      }
    });
  }

  dispose(): void {
    this.subscription?.remove();
    this.subscription = null;
    this.currentState = null;
    this.listeners.clear();
  }
}

export interface ReactNativeAppLifecycleOptions {
  readonly AppState: ReactNativeAppState;
}

export function reactNativeAppLifecycle<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(options: ReactNativeAppLifecycleOptions): ALReactNativePlugin<EventMap> {
  return {
    name: REACT_NATIVE_APP_LIFECYCLE_PLUGIN,
    install(_channel, context) {
      const appState = options.AppState;
      if (appState == null) {
        throw new Error('React Native app lifecycle requires AppState.');
      }
      const lifecycle = new ALAppLifecycle(appState, context.now);
      context.installAppLifecycle(lifecycle);
      return {
        start() {
          lifecycle.start();
        },
        dispose() {
          lifecycle.dispose();
          context.removeAppLifecycle(lifecycle);
        },
      };
    },
  };
}

export default Object.freeze({
  ALAppLifecycle,
  reactNativeAppLifecycle,
  REACT_NATIVE_APP_LIFECYCLE_PLUGIN,
});
