/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

/* eslint-disable @typescript-eslint/no-invalid-void-type */

import type {
  BaseChannelEventType,
  Channel,
} from 'hyperion-channel/src/Channel';

export interface ALPluginLifecycle {
  /** Starts event sources after every configured plugin has installed. */
  start?(): void;
  /** Must be safe after installation even when start was never called. */
  dispose?(): void;
}

export type ALPluginInit<EventMap extends BaseChannelEventType, Context> = (
  channel: Channel<EventMap>,
  context: Context
) => void | ALPluginLifecycle;

export type ALChannelPluginInit<EventMap extends BaseChannelEventType> = (
  channel: Channel<EventMap>
) => void | ALPluginLifecycle;

export interface ALManagedPlugin<
  EventMap extends BaseChannelEventType,
  Context
> {
  readonly name: string;
  readonly dependencies?: readonly string[];
  /**
   * Installs passive hooks and returns lifecycle work. Event sources start in
   * `start()`. An install that throws must first undo its own side effects.
   */
  install(
    channel: Channel<EventMap>,
    context: Context
  ): void | ALPluginLifecycle;
}

export type ALPluginEventMap<Plugin> = Plugin extends ALManagedPlugin<
  infer EventMap,
  unknown
>
  ? EventMap
  : Plugin extends (
      channel: Channel<infer EventMap extends BaseChannelEventType>,
      ...args: never[]
    ) => unknown
  ? EventMap
  : never;

type UnionToIntersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never;

export type ALPluginEventMapIntersection<Plugins extends readonly unknown[]> =
  UnionToIntersection<ALPluginEventMap<Plugins[number]>> extends infer EventMap
    ? EventMap extends BaseChannelEventType
      ? EventMap
      : never
    : never;

/** Runs web-compatible plugins immediately, strictly, and with one argument. */
export function initializePluginsStrictly<
  EventMap extends BaseChannelEventType
>(
  channel: Channel<EventMap>,
  plugins: readonly (ALChannelPluginInit<EventMap> | null | undefined)[]
): void {
  plugins.forEach((plugin) => plugin?.(channel));
}
