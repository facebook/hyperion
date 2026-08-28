/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import JsxDevRuntime from 'react/jsx-dev-runtime';
import JsxRuntime from 'react/jsx-runtime';
import { AppState } from 'react-native';
import { reactNativeAppLifecycle } from 'hyperion-react-native/app-lifecycle';
import { reactNativeAppStateEvents } from 'hyperion-react-native/app-state-events';
import { reactNativeDeepLinks } from 'hyperion-react-native/deep-links';
import { reactNativeHeartbeat } from 'hyperion-react-native/heartbeat';
import { reactNativeListImpressions } from 'hyperion-react-native/list-impressions';
import { reactNativeReactErrors } from 'hyperion-react-native/react-errors';
import {
  type ALReactNativeEventMap,
  type PluginInitOptions,
} from 'hyperion-react-native/runtime';
import { reactNativeScreens } from 'hyperion-react-native/screens';
import { reactNativeSurfaces } from 'hyperion-react-native/surfaces';
import { reactNativeUIEvents } from 'hyperion-react-native/ui-events';
import { createAutoLoggingChannel } from 'hyperion-react-native/channel';

export const APP_NAME = 'hyperion_react_native_testapp';
export const AUTO_LOGGING_CHANNEL =
  createAutoLoggingChannel<ALReactNativeEventMap>();

export const AUTO_LOGGING_CONFIG = Object.freeze({
  channel: AUTO_LOGGING_CHANNEL,
  plugins: Object.freeze([
    reactNativeSurfaces(),
    reactNativeUIEvents({
      ReactModule: React,
      JSXRuntimeModule: JsxRuntime,
      JSXDevRuntimeModule: JsxDevRuntime,
      debug: true,
    }),
    reactNativeAppLifecycle({ AppState }),
    reactNativeHeartbeat({
      heartbeatInterval: 5_000,
      maxUserInactivityDuration: 30_000,
    }),
    reactNativeAppStateEvents(),
    reactNativeScreens(),
    reactNativeListImpressions(),
    reactNativeDeepLinks(),
    reactNativeReactErrors(),
  ]),
}) satisfies PluginInitOptions<ALReactNativeEventMap>;
