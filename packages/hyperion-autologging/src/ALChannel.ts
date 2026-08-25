/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { BaseChannelEventType } from 'hyperion-channel/src/Channel';
import { ResilientChannel } from 'hyperion-channel/src/ResilientChannel';
import type { HookErrorHandler } from 'hyperion-hook/src/ResilientHook';

declare const autoLoggingChannel: unique symbol;

export type AutoLoggingChannel<EventMap extends BaseChannelEventType> =
  ResilientChannel<EventMap> & {
    readonly [autoLoggingChannel]: true;
  };

export function createAutoLoggingChannel<EventMap extends BaseChannelEventType>(
  onError?: HookErrorHandler
): AutoLoggingChannel<EventMap> {
  return new ResilientChannel<EventMap>(
    onError
  ) as AutoLoggingChannel<EventMap>;
}
