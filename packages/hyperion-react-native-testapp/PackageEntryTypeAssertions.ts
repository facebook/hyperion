/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import AppLifecycle from 'hyperion-react-native/app-lifecycle';
import AppStateEvents from 'hyperion-react-native/app-state-events';
import {
  Channel,
  Hook,
  PausableChannel,
  PipeableEmitter,
  ResilientChannel,
} from 'hyperion-react-native/channel';
import DeepLinks from 'hyperion-react-native/deep-links';
import Heartbeat from 'hyperion-react-native/heartbeat';
import Lifecycle from 'hyperion-react-native/lifecycle';
import ListImpressions from 'hyperion-react-native/list-impressions';
import ReactErrors from 'hyperion-react-native/react-errors';
import Runtime, {
  type ALReactNativeEventMap,
  type PluginInitOptions,
} from 'hyperion-react-native/runtime';
import Screens from 'hyperion-react-native/screens';
import Surfaces from 'hyperion-react-native/surfaces';
import Transport from 'hyperion-react-native/transport';
import UIEvents from 'hyperion-react-native/ui-events';

type IsAny<Value> = 0 extends 1 & Value ? true : false;
type AssertFalse<Value extends false> = Value;

export type RuntimeOptionsRemainTyped = AssertFalse<
  IsAny<PluginInitOptions<ALReactNativeEventMap>>
>;

export const CONDITIONAL_ENTRY_DEFAULTS = Object.freeze([
  AppLifecycle,
  AppStateEvents,
  DeepLinks,
  Heartbeat,
  Lifecycle,
  ListImpressions,
  ReactErrors,
  Runtime,
  Screens,
  Surfaces,
  Transport,
  UIEvents,
]);

export const LEGACY_CHANNEL_CONSTRUCTORS = Object.freeze([
  Channel,
  Hook,
  PausableChannel,
  PipeableEmitter,
  ResilientChannel,
]);
