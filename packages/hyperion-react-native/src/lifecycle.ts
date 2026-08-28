/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import {
  reactNativeAppLifecycle,
  REACT_NATIVE_APP_LIFECYCLE_PLUGIN,
} from './ALAppLifecycle';
export type {
  ALAppStateListener,
  ReactNativeAppLifecycleOptions,
} from './ALAppLifecycle';
import { reactNativeAppStateEvents } from './ALAppStateEvents';
import {
  ALHeartbeatType,
  reactNativeHeartbeat,
  REACT_NATIVE_HEARTBEAT_PLUGIN,
} from './ALHeartbeat';

export {
  ALHeartbeatType,
  reactNativeAppLifecycle,
  reactNativeAppStateEvents,
  reactNativeHeartbeat,
  REACT_NATIVE_APP_LIFECYCLE_PLUGIN,
  REACT_NATIVE_HEARTBEAT_PLUGIN,
};
export type { ReactNativeHeartbeatOptions } from './ALHeartbeat';
export type {
  AppStateStatus,
  ReactNativeAppState,
  ReactNativeAppStateSubscription,
  ReactNativeModuleExports,
} from './IReactNative';

export default Object.freeze({
  ALHeartbeatType,
  reactNativeAppLifecycle,
  reactNativeAppStateEvents,
  reactNativeHeartbeat,
  REACT_NATIVE_APP_LIFECYCLE_PLUGIN,
  REACT_NATIVE_HEARTBEAT_PLUGIN,
});
