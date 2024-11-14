/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import "./reference";

import type { BaseChannelEventType, Channel } from "hyperion-channel/src/Channel";
import * as Types from "hyperion-util/src/Types";
import { ALFlowletManager, IALFlowlet } from './ALFlowletManager';
import { ALID } from "./ALID";

export type ALFlowletEvent = Readonly<{
  callFlowlet: IALFlowlet;
  triggerFlowlet: IALFlowlet | null | undefined;
}>;

export type ALOptionalFlowletEvent = Omit<ALFlowletEvent, 'callFlowlet'> & Readonly<{
  callFlowlet: ALFlowletEvent['callFlowlet'] | null;
}>;

export type ALTimedEvent = Readonly<{
  eventTimestamp: number;
}>;

export type Metadata = {
  [Key: string]: string;
};

export type ALMetadataEvent = Readonly<{
  /**
   * Extended data do be logged along with the event payload later
   */
  metadata: Metadata;
}>;

export type ALExtensibleEventData = { [key: string]: any };
export type ALExtensibleEvent = {
  /**
   * Temporary data that application might want to attach to
   * event payload but will be dropped when logging or serializing.
   * The data must be organized with namespaces to avoid collision
   */
  __ext?: { [namespace: string]: ALExtensibleEventData };
};


/**
 * Generally we will have publishers that generate various events.
 * In some cases, the event is final and we want that to be logged eventually.
 * In such cases, we need to add an eventIndex to keep track events.
 *
 * In some cases, publisher may generate an event but there is an expectation
 * that applications may fileter some of them out (e.g. network, mousemove, ...)
 * In such cases, the publishers should use the ALEvent base type instead
 * for their events to signal to the subscribers that they need to add extra
 * information as needed.
 */
export type ALLoggableEvent = ALTimedEvent & ALMetadataEvent & Readonly<{
  eventIndex: number;
  relatedEventIndex?: number;
}>;

export type ALPageEvent = {
  // window.location.href when the event was captured
  pageURI: URL;
};

export type ALReactElementEvent = Readonly<{
  reactComponentName?: string | null;
  reactComponentStack?: string[] | null;
}>;

export type ALSharedInitOptions<ChannelEventType extends BaseChannelEventType = never> = Types.Options<{
  flowletManager: ALFlowletManager;
  channel: Channel<ChannelEventType>;
}>;

export type ALElementEvent = Readonly<{
  // Element associated with the event, usually the root of a sub-tree, an interactable target element, or domEvent.target
  element: HTMLElement;

  // The underlying identifier assigned to this element
  autoLoggingID: ALID;
}>;
