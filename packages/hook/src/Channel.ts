/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "./Hook";

type Listener<V extends any[]> = (...args: V) => void;
type Listeners<V extends any[]> = Hook<Listener<V>>;
type ChannelListeners<T extends { [key: string]: any[] }> = {
  [P in keyof T]: Listeners<T[P]>
}

interface IEmitter<TEventToListenerArgsMap extends { [key: string]: any[] }> {
  emit<
    TEvent extends keyof TEventToListenerArgsMap,
    TArgs extends TEventToListenerArgsMap[TEvent]
  >(eventType: TEvent, ...rawArgs: TArgs): void;
}

export class PipeableEmitter<TEventToListenerArgsMap extends { [key: string]: any[] }> implements IEmitter<TEventToListenerArgsMap>{
  private _next: IEmitter<TEventToListenerArgsMap>['emit'] | null = null;

  pipe<T extends IEmitter<TEventToListenerArgsMap>>(nextChannel: T, scheduler?: (task: () => void) => void): T {
    this._next = scheduler
      ? (eventType, ...args) => {
        scheduler(() => {
          nextChannel.emit(eventType, ...args);
        });
      }
      : (eventType, ...args) => {
        nextChannel.emit(eventType, ...args);
      };
    return nextChannel;
  }

  emit<
    TEvent extends keyof TEventToListenerArgsMap,
    TArgs extends TEventToListenerArgsMap[TEvent]
  >(eventType: TEvent, ...rawArgs: TArgs): void {
    this._next?.(eventType, ...rawArgs);
  }
}


export class Channel<TEventToListenerArgsMap extends { [key: string]: any[] }>
  extends PipeableEmitter<TEventToListenerArgsMap>
  implements IEmitter<TEventToListenerArgsMap>
{
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

  addListener<TEvent extends keyof TEventToListenerArgsMap>(
    eventType: TEvent,
    listener: Listener<TEventToListenerArgsMap[TEvent]>,
  ): Listener<TEventToListenerArgsMap[TEvent]> {
    return this.on(eventType).add(listener);
  }

  removeListener<TEvent extends keyof TEventToListenerArgsMap>(
    eventType: TEvent,
    listener: Listener<TEventToListenerArgsMap[TEvent]>,
  ): Listener<TEventToListenerArgsMap[TEvent]> {
    this.on(eventType).remove(listener);
    return listener;
  }

  emit<
    TEvent extends keyof TEventToListenerArgsMap,
    TArgs extends TEventToListenerArgsMap[TEvent]
  >(eventType: TEvent, ...rawArgs: TArgs): void {
    // First the listeners of this channel will get the event
    this._getOrAddHandler(eventType).call(...rawArgs);

    // Then the event is passed to the next channel
    super.emit(eventType, ...rawArgs);
  }
}
