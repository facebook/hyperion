/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel } from "hyperion-channel/src/Channel";
import * as AutoLogging from "hyperion-react-native/src/AutoLogging";

export const SyncChannel = new Channel<
  AutoLogging.ALChannelEvent &
  { test: [number, string] }
>();
