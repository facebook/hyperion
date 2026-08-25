/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import type { Hook } from 'hyperion-hook/src/Hook';
import { ResilientHook } from 'hyperion-hook/src/ResilientHook';
import type { HookErrorHandler } from 'hyperion-hook/src/ResilientHook';
import { Channel, PausableChannel } from './Channel';
import type { BaseChannelEventType } from './Channel';

export class ResilientChannel<
  TEventToListenerArgsMap extends BaseChannelEventType
> extends Channel<TEventToListenerArgsMap> {
  constructor(private readonly onError?: HookErrorHandler) {
    super();
    // Pipe callbacks are created by the base class before this subclass is initialized.
    this.resetPipeHook();
  }

  protected createHook<
    CallbackType extends (...args: never[]) => unknown
  >(): Hook<CallbackType> {
    return new ResilientHook<CallbackType>((error) => this.onError?.(error));
  }
}

export class ResilientPausableChannel<
  TEventToListenerArgsMap extends BaseChannelEventType
> extends PausableChannel<TEventToListenerArgsMap> {
  constructor(private readonly onError?: HookErrorHandler) {
    super();
    // Pipe callbacks are created by the base class before this subclass is initialized.
    this.resetPipeHook();
  }

  protected createHook<
    CallbackType extends (...args: never[]) => unknown
  >(): Hook<CallbackType> {
    return new ResilientHook<CallbackType>((error) => this.onError?.(error));
  }
}
