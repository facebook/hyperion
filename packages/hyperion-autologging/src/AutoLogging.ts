/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { Channel, ChannelEventType } from "hyperion-channel/src/Channel";
import { SafeGetterSetter } from "hyperion-util/src/SafeGetterSetter";
import * as Types from "hyperion-util/src/Types";
import * as ALCustomEvent from "./ALCustomEvent";
import * as ALDOMSnapshotPublisher from "./ALDOMSnaptshotPublisher";
import * as ALFlowletPublisher from "./ALFlowletPublisher";
import * as ALHeartbeat from "./ALHeartbeat";
import * as ALInteractableDOMElement from "./ALInteractableDOMElement";
import * as ALNetworkPublisher from "./ALNetworkPublisher";
import { initializePluginsStrictly, type ALChannelPluginInit } from './ALPlugin';
import { ComponentNameValidator } from "./ALReactUtils";
import * as ALSessionFlowID from "./ALSessionFlowID";
import * as ALSurface from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";
import * as ALSurfaceProxy from "./ALSurfaceProxy";
import * as ALSurfaceVisibilityPublisher from "./ALSurfaceVisibilityPublisher";
import * as ALTriggerFlowlet from "./ALTriggerFlowlet";
import { ALSharedInitOptions } from "./ALType";
import * as ALUIEventPublisher from "./ALUIEventPublisher";
import { createWebAutoLoggingPlugins } from './ALWebPlugins';

/**
 * This type extracts the union of all events types so that external modules
 * don't have to import these types one by one.
 */
export type ALChannelEvent = ChannelEventType<
  ALFlowletPublisher.InitOptions['channel'] &
  ALSurface.InitOptions['channel'] &
  ALUIEventPublisher.InitOptions['channel'] &
  ALHeartbeat.InitOptions['channel'] &
  ALSurfaceMutationPublisher.InitOptions['channel'] &
  ALSurfaceVisibilityPublisher.InitOptions['channel'] &
  ALNetworkPublisher.InitOptions['channel'] &
  ALSessionFlowID.InitOptions['channel'] &
  ALCustomEvent.ALCustomEventChannel
>;

type PublicInitOptions<T> = Omit<T, keyof ALSharedInitOptions<never> | 'react'>;

type PluginInit = ALChannelPluginInit<ALChannelEvent>;

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelEvent> &
  {
    react: (ALSurfaceProxy.InitOptions & ALTriggerFlowlet.InitOptions)['react'];
    enableReactComponentVisitors?: boolean;
    componentNameValidator?: ComponentNameValidator;
    flowletPublisher?: PublicInitOptions<ALFlowletPublisher.InitOptions> | null;
    surface: PublicInitOptions<ALSurface.InitOptions>;
    elementText?: ALInteractableDOMElement.ALElementTextOptions | null;
    uiEventPublisher?: PublicInitOptions<ALUIEventPublisher.InitOptions> | null;
    heartbeat?: PublicInitOptions<ALHeartbeat.InitOptions> | null;
    surfaceMutationPublisher?: PublicInitOptions<ALSurfaceMutationPublisher.InitOptions> | null;
    surfaceVisibilityPublisher?: PublicInitOptions<ALSurfaceVisibilityPublisher.InitOptions> | null;
    network?: PublicInitOptions<ALNetworkPublisher.InitOptions> | null;
    triggerFlowlet?: PublicInitOptions<ALTriggerFlowlet.InitOptions> | null;
    domSnapshotPublisher?: PublicInitOptions<ALDOMSnapshotPublisher.InitOptions> | null;
    plugins?: (null | undefined | PluginInit)[];
    sessionFlowID?: PublicInitOptions<ALSessionFlowID.InitOptions> | null;
  }
>;

const _options = new SafeGetterSetter<InitOptions>('AutoLogging options');

/**
 *
 * @param options enables various features with their own init option
 * @returns true if initilized (the first time) or false if it is already initialized.
 */
export function init(options: InitOptions): boolean {
  if (_options.isSet()) {
    return false;
  }
  _options.set(options);

  /**
   * To support plugins, we have an internal channel that
   * all internal features of AutoLogging send their events
   * to this internal channel.
   * Plugins will use this channel which gives them the first
   * chance to make any changes to the events.
   * The output of this channel is piped to the channel that was
   * passed as options.
   * This way, we enfore order of execution among plugins vs rest of
   * application code.
   */
  let channel = options.channel;
  if (options.plugins) {
    const pluginChannel = new Channel<ALChannelEvent>();
    pluginChannel.pipe(options.channel);
    initializePluginsStrictly(pluginChannel, options.plugins);
    channel = pluginChannel;
  }

  initializePluginsStrictly(channel, createWebAutoLoggingPlugins(options));

  return true;
}


/**
 * Gets the init options passed when initializing AutoLogging.
 * Can be useful to get configured channels, registered events, and other information after framework initialization.
 */
export function getInitOptions(): InitOptions {
  return _options.get();
}
