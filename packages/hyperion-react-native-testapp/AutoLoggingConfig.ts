/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import React from 'react';
import * as JsxDevRuntime from 'react/jsx-dev-runtime';
import * as JsxRuntime from 'react/jsx-runtime';
import { AppState } from 'react-native';
import { Channel } from 'hyperion-channel';
import type { ALChannelEventMap, InitOptions } from 'hyperion-react-native';

export const AUTO_LOGGING_CHANNEL = new Channel<ALChannelEventMap>();

export const AUTO_LOGGING_CONFIG = Object.freeze({
  channel: AUTO_LOGGING_CHANNEL,
  appName: 'hyperion_react_native_testapp',
  enabled: true,
  heartbeatInterval: 5_000,
  maxUserInactivityDuration: 30_000,
  debug: true,
  react: {
    ReactModule: React,
    JSXRuntimeModule: JsxRuntime,
    JSXDevRuntimeModule: JsxDevRuntime,
    ReactNativeModule: { AppState },
  },
} satisfies InitOptions);
