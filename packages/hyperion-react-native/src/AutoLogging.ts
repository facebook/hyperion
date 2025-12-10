/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Channel, ChannelEventType } from "hyperion-channel/src/Channel";
import type * as Types from "hyperion-util/src/Types";

import * as IReactComponent from "hyperion-react/src/IReactComponent";
import TestAndSet from 'hyperion-test-and-set/src/TestAndSet';
import * as ALReactComponentProps from "./ALReactComponentProps";
import * as ALSurfacePublisher from "./ALSurfacePublisher";

'use strict';


export type ALChannelEvent = ChannelEventType<
  & ALReactComponentProps.InitOptions['channel']
  & ALSurfacePublisher.InitOptions['channel']
>

type PublicInitOptions<T> = Omit<T, 'react' | 'channel'>;

export type InitOptions = Types.Options<{
  react: IReactComponent.InitOptions;
  channel: Channel<ALChannelEvent>;
  props?: PublicInitOptions<ALReactComponentProps.InitOptions> | null;
}>

const initialized = new TestAndSet();
export function init(options: InitOptions): void {
  if (initialized.testAndSet()) {
    return;
  }

  let channel = options.channel;

  IReactComponent.init(options.react);

  ALSurfacePublisher.publish({channel})

  if (options.props) {
    ALReactComponentProps.publish({
      channel,
      ...options.props,
    })
  }
}
