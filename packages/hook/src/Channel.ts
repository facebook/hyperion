/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "./Hook";

type Listener<V extends any[]> = (...args: V) => void;
type Listeners<V extends any[]> = Hook<Listener<V>>;
type ChannelListeners<T extends { [key: string]: any[] }> = {
  [P in keyof T]: Listeners<T[P]>
}

export class Channel<TEventToListenerArgsMap extends { [key: string]: any[] }> {
  private _listeners: ChannelListeners<TEventToListenerArgsMap> = Object.create(null);

  private _getOrAddHandler<TEvent extends keyof TEventToListenerArgsMap>(
    eventType: TEvent,
  ): Listeners<TEventToListenerArgsMap[TEvent]> {
    let handler: Listeners<TEventToListenerArgsMap[TEvent]> =
      this._listeners[eventType];
    if (!handler) {
      handler = this._listeners[eventType] = new Hook<Listener<TEventToListenerArgsMap[TEvent]>>();
    }
    return handler;
  }

  on<TEvent extends keyof TEventToListenerArgsMap>(eventType: TEvent): Listeners<TEventToListenerArgsMap[TEvent]> {
    return this._getOrAddHandler(eventType);
  }

  emit<
    TEvent extends keyof TEventToListenerArgsMap,
    TArgs extends TEventToListenerArgsMap[TEvent]
  >(eventType: TEvent, ...rawArgs: TArgs): void {
    this._getOrAddHandler(eventType).call(...rawArgs);
  }
}