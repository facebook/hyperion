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

interface PendingAppStateTransition {
  state: AppStateStatus;
  readonly previousState: AppStateStatus;
  readonly timestamp: number;
  readonly timer: ReturnType<typeof setTimeout>;
}

export class ALAppLifecycle implements ALAppLifecycleEnvironment {
  private currentState: AppStateStatus | null = null;
  private readonly listeners = new Set<ALAppStateListener>();
  private pendingTransition: PendingAppStateTransition | null = null;
  private subscription: { remove(): void } | null = null;
  private readonly transientInactiveMs: number;

  constructor(
    private readonly appState: ReactNativeAppState,
    private readonly now: () => number,
    transientInactiveMs = 0
  ) {
    this.transientInactiveMs =
      Number.isFinite(transientInactiveMs) && transientInactiveMs > 0
        ? transientInactiveMs
        : 0;
  }

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
      const timestamp = this.now();
      const pendingTransition = this.pendingTransition;
      if (pendingTransition != null) {
        if (state === 'active') {
          this.clearPendingTransition();
          if (
            timestamp - pendingTransition.timestamp >=
            this.transientInactiveMs
          ) {
            this.dispatch(
              pendingTransition.state,
              pendingTransition.previousState,
              pendingTransition.timestamp
            );
            if (this.subscription != null) {
              this.dispatch(state, pendingTransition.state, timestamp);
            }
          }
        } else {
          pendingTransition.state = state;
        }
        return;
      }
      if (
        this.transientInactiveMs > 0 &&
        this.currentState === 'active' &&
        state !== 'active'
      ) {
        const transition: PendingAppStateTransition = {
          state,
          previousState: this.currentState,
          timestamp,
          timer: setTimeout(() => {
            if (this.pendingTransition !== transition) return;
            this.pendingTransition = null;
            this.dispatch(
              transition.state,
              transition.previousState,
              transition.timestamp
            );
          }, this.transientInactiveMs),
        };
        this.pendingTransition = transition;
        return;
      }
      this.dispatch(state, this.currentState, timestamp);
    });
  }

  dispose(): void {
    this.clearPendingTransition();
    this.subscription?.remove();
    this.subscription = null;
    this.currentState = null;
    this.listeners.clear();
  }

  private clearPendingTransition(): void {
    if (this.pendingTransition == null) return;
    clearTimeout(this.pendingTransition.timer);
    this.pendingTransition = null;
  }

  private dispatch(
    state: AppStateStatus,
    previousState: AppStateStatus | null,
    timestamp: number
  ): void {
    this.currentState = state;
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
  }
}

export interface ReactNativeAppLifecycleOptions {
  readonly AppState: ReactNativeAppState;
  readonly transientInactiveMs?: number;
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
      const lifecycle = new ALAppLifecycle(
        appState,
        context.now,
        options.transientInactiveMs
      );
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
