/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import { ResilientChannel } from 'hyperion-channel/src/ResilientChannel';
import type { HookErrorHandler } from 'hyperion-hook/src/ResilientHook';

export type AutoLoggingChannel<EventMap extends BaseChannelEventType> =
  ResilientChannel<EventMap>;

export function createAutoLoggingChannel<EventMap extends BaseChannelEventType>(
  onError?: HookErrorHandler
): AutoLoggingChannel<EventMap> {
  return new ResilientChannel<EventMap>(onError);
}
