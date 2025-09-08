/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AutoLogging, Channel } from "hyperion-react-native/src";

export const SyncChannel = new Channel<
  AutoLogging.ALChannelEvent &
  { test: [number, string] }
>();
