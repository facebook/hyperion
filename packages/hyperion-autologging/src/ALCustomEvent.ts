/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";

import { ALLoggableEvent, ALMetadataEvent, ALOptionalFlowletEvent, ALTimedEvent } from "./ALType";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import * as ALEventIndex from "./ALEventIndex";
import { ALFlowletDataType, ALFlowletManager } from "./ALFlowletManager";

export type ALCustomEventData =
  ALMetadataEvent &
  ALOptionalFlowletEvent &
  ALTimedEvent &
  Partial<ALLoggableEvent> & Readonly<{
    event: 'custom';
  }>;

export type ALChannelCustomEvent = Readonly<{
  al_custom_event: [ALCustomEventData],
}>;

export type ALCustomEventChannel = Channel<ALChannelCustomEvent>;

export function emitALCustomEvent<T extends ALFlowletDataType>(channel: ALCustomEventChannel, flowletManager: ALFlowletManager<T>, metadata: ALMetadataEvent['metadata'], nonLoggable?: boolean): ALCustomEventData {
  const flowlet = flowletManager.top();
  const event: ALCustomEventData = {
    event: 'custom',
    eventTimestamp: performanceAbsoluteNow(),
    eventIndex: nonLoggable ? void 0 : ALEventIndex.getNextEventIndex(),
    flowlet,
    triggerFlowlet: flowlet?.data.triggerFlowlet,
    metadata
  }
  channel.emit('al_custom_event', event);
  return event;
}