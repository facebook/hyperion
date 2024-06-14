/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hyperion-hook/src/Hook";
type ListenerArgs = unknown[];
type Listener<V extends ListenerArgs> = (...args: V) => void;
type Listeners<V extends ListenerArgs> = Hook<Listener<V>>;
export type BaseChannelEventType = { [key: string]: ListenerArgs; };
type ChannelListeners<T extends BaseChannelEventType> = {
  [P in keyof T]: Listeners<T[P]> | undefined;
}

export type ChannelEventType<ChannelType> = ChannelType extends Channel<infer EventType> ? EventType : never;

interface IEmitter<TEventToListenerArgsMap extends BaseChannelEventType> {
  emit<
    TEvent extends keyof TEventToListenerArgsMap,
    TArgs extends TEventToListenerArgsMap[TEvent]
  >(eventType: TEvent, ...rawArgs: TArgs): void;
}

interface IPipedEmitter<TEventToListenerArgsMap extends BaseChannelEventType> {
  emit<
    TEvent extends keyof TEventToListenerArgsMap,
  >(eventType: TEvent, ...rawArgs: any): void;
}


/// Checks if two types are the same
type IfEquals<T, U, Y = unknown, N = never> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? Y : N;

/// Returns the subset of Dest that has the same keys as Src
type Sub<Dest, Src> = Omit<Dest, Exclude<keyof Dest, keyof Src>>;


/// Extracts events of a give type
type Events<T> =
  T extends IPipedEmitter<infer E> ? E
  : T extends IPipedEmitter<infer E> ? E
  : T extends PipeableEmitter<infer E> ? E
  : T extends Channel<infer E> ? E
  : never;

/// Checks strict equality of the events of T with BaseEvents. 
type Check<T, BaseEvents> = IfEquals<Sub<Events<T>, BaseEvents>, BaseEvents, unknown, never>;

export class PipeableEmitter<TEventToListenerArgsMap extends BaseChannelEventType> implements IEmitter<TEventToListenerArgsMap> {
  private _next = new Hook<IEmitter<TEventToListenerArgsMap>['emit']>();

  /**
   * If the nextChannel is a super set of events of the current one, we still want to allow the
   * pipe to work. This type overload enables that by using a less restrictive emit function.
   * As long as events names are a subset of TEventToListenerArgsMap, it will be ok.
   * The P parameter bellow also detects if the arguments of the event names exactly match. In rare cases that the nextChannel
   * has redefined existing event types, this argument turn off the return type of this function. Note that, ideally we should
   * create a compile time error, but I couldn't figure out how to do this with a single argument to the function.
   */
  pipe<T extends IPipedEmitter<TEventToListenerArgsMap>, P = Check<T, TEventToListenerArgsMap>>(nextChannel: T, scheduler?: (task: () => void) => void): T & P;
  pipe<T extends IEmitter<TEventToListenerArgsMap>>(nextChannel: T, scheduler?: (task: () => void) => void): T {
    const handler = this._next.add(scheduler
      ? (eventType, ...args) => {
        scheduler(() => {
          nextChannel.emit(eventType, ...args);
        });
      }
      : (eventType, ...args) => {
        nextChannel.emit(eventType, ...args);
      }
    );
    //@ts-ignore
    handler._channel = nextChannel;
    return nextChannel;
  }
  unpipe<T extends IEmitter<TEventToListenerArgsMap>>(nextChannel: T): boolean {
    return this._next.removeIf(hook =>
      //@ts-ignore
      hook._channel === nextChannel);
  }

  emit<
    TEvent extends keyof TEventToListenerArgsMap,
    TArgs extends TEventToListenerArgsMap[TEvent]
  >(eventType: TEvent, ...rawArgs: TArgs): void {
    this._next.call(eventType, ...rawArgs);
  }
}


export class Channel<TEventToListenerArgsMap extends BaseChannelEventType>
  extends PipeableEmitter<TEventToListenerArgsMap>
  implements IEmitter<TEventToListenerArgsMap> {
  private _listeners: ChannelListeners<TEventToListenerArgsMap> = Object.create(null);

  private _getOrAddHandler<TEvent extends keyof TEventToListenerArgsMap>(
    eventType: TEvent,
  ): Listeners<TEventToListenerArgsMap[TEvent]> {
    let handler: Listeners<TEventToListenerArgsMap[TEvent]> | undefined =
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

export class PausableChannel<TEventToListenerArgsMap extends BaseChannelEventType> extends Channel<TEventToListenerArgsMap> {
  private _paused: boolean = false;

  pause(): void {
    this._paused = true;
  }
  unpause(): void {
    this._paused = false;
  }

  emit<
    TEvent extends keyof TEventToListenerArgsMap,
    TArgs extends TEventToListenerArgsMap[TEvent]
  >(eventType: TEvent, ...rawArgs: TArgs): void {
    if (this._paused) {
      return;
    }

    super.emit(eventType, ...rawArgs);
  }


}
