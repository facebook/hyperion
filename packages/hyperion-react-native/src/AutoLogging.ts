/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel, ChannelEventType } from "hyperion-channel/src/Channel";
import type * as Types from "hyperion-util/src/Types";

import * as IReactComponent from "hyperion-react/src/IReactComponent";
import TestAndSet from 'hyperion-test-and-set/src/TestAndSet';
import * as ALComponentPropPublisher from "./ALComponentPropPublisher";
import * as ALSurfacePublisher from "./ALSurfacePublisher";

'use strict';


export type ALChannelEvent = ChannelEventType<
  & ALComponentPropPublisher.InitOptions['channel']
  & ALSurfacePublisher.InitOptions['channel']
>

type PublicInitOptions<T> = Omit<T, 'react' | 'channel'>;

type PluginInit = (channel: Channel<ALChannelEvent>) => void;

export type InitOptions = Types.Options<{
  react: IReactComponent.InitOptions;
  channel: Channel<ALChannelEvent>;
  componentProps?: PublicInitOptions<ALComponentPropPublisher.InitOptions> | null;
  plugins?: (null | undefined | PluginInit)[];
}>

const initialized = new TestAndSet();
export function init(options: InitOptions): void {
  if (initialized.testAndSet()) {
    return;
  }

  let channel = options.channel;

  if (options.plugins) {
    const pluginChannel = new Channel<ALChannelEvent>();
    pluginChannel.pipe(options.channel);
    options.plugins.forEach(plugin => plugin?.(pluginChannel));
    channel = pluginChannel;
  }

  IReactComponent.init(options.react);

  ALSurfacePublisher.publish({channel})

  if (options.componentProps) {
    ALComponentPropPublisher.publish({
      channel,
      ...options.componentProps,
    })
  }
}
