/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import type { ALChannelEvent } from "@hyperion/hyperion-autologging/src/AutoLogging";
import { Channel } from "@hyperion/hyperion-channel";
import * as XXH from "xxhashjs"

export function init(channel: Channel<ALChannelEvent>): void {
  const xxh = XXH.h64(0xABCD);
  channel.addListener('al_ui_event', eventData => {
    const data = `${eventData.event},${eventData.pageURI.pathname},${eventData.surface ?? ''},${eventData.reactComponentName ?? ''},${eventData.elementName ?? ''}` + null;
    eventData.metadata.hash = xxh.update(data).digest().toString(16);
  });
}