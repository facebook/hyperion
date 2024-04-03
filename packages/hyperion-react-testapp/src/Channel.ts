/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel } from "@hyperion/hyperion-channel/src/Channel";
import * as AutoLogging from "@hyperion/hyperion-autologging/src/AutoLogging";

export const SyncChannel = new Channel<
  AutoLogging.ALChannelEvent &
  { test: [number, string] }
>();
