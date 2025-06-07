/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel } from "hyperion-channel/src/Channel";
import * as AutoLogging from "hyperion-autologging/src/AutoLogging";
import * as PluginFPS from "hyperion-autologging-plugin-fps/src/index";

export const SyncChannel = new Channel<
  AutoLogging.ALChannelEvent &
  { test: [number, string] } &
  PluginFPS.ALChannelFPSEvent
>();
