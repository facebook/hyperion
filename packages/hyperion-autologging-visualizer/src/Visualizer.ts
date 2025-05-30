/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import * as Types from "hyperion-util/src/Types";
import * as AutoLogging from "hyperion-autologging/src/AutoLogging";
import { Channel } from "hyperion-channel/src/Channel";
import * as ElementTextTooltip from "./component/ElementTextTooltip.react";

export type InitOptions = Types.Options<
  Pick<AutoLogging.InitOptions, 'flowletManager'> &
  {
    channel: Channel<AutoLogging.ALChannelEvent>
  }
>;

 export function init(options: InitOptions) {
  ElementTextTooltip.init(options);
}
