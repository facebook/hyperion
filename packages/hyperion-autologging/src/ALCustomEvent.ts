/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";

import { ALLoggableEvent, ALMetadataEvent, ALOptionalFlowletEvent, ALTimedEvent } from "./ALType";

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
