/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AppState } from 'react-native';
import type { InitOptions } from 'hyperion-react-native';

export const AUTO_LOGGING_CONFIG = Object.freeze({
  appName: 'hyperion_react_native_testapp',
  enabled: true,
  heartbeatInterval: 5_000,
  maxUserInactivityDuration: 30_000,
  debug: true,
  react: { ReactNativeModule: { AppState } },
} satisfies InitOptions);
