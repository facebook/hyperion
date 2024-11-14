/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "hyperion-channel/src/Channel";
import * as Types from "hyperion-util/src/Types";

import * as Flowlet from "hyperion-flowlet/src/Flowlet";
import { IALFlowlet } from "./ALFlowletManager";
import { ALMetadataEvent } from "./ALType";

export type ALFlowletEventData = ALMetadataEvent & Readonly<{
  flowlet: IALFlowlet;
}>;

export type ALChannelFlowletEvent = Readonly<{
  al_flowlet_event: [ALFlowletEventData],
}>;

export type ALFlowletChannel = Channel<ALChannelFlowletEvent>;

export type InitOptions = Types.Options<
  {
    channel: ALFlowletChannel;
  }
>;

export function publish(options: InitOptions): void {
  Flowlet.onFlowletInit.add(flowlet => {
    options.channel.emit('al_flowlet_event', {
      flowlet,
      metadata: {},
    });
  });
}