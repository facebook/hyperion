/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import {Channel} from 'hyperion-channel/src/Channel';
import type {ALHeartbeatType} from 'hyperion-autologging/src/ALHeartbeatType';
import type {
  ALChannelEventMap,
  ALCustomEventLevel,
  ALDeepLinkSource,
  SurfaceMetadata,
} from './ALTypes';
import type {ALSurfaceDataNode} from './ALSurface';

interface SurfaceRequest {
  timestamp: number;
  instance: ALSurfaceDataNode;
  surface: string;
  surfacePath: string;
  surfaceData: ALSurfaceDataNode;
  metadata: SurfaceMetadata;
}

export type ALRuntimeChannelEventMap = ALChannelEventMap & {
  al_surface_mount_request: [SurfaceRequest];
  al_surface_unmount_request: [
    SurfaceRequest & {mountedDuration: number},
  ];
  al_heartbeat_request: [{type: ALHeartbeatType; timestamp: number}];
  al_app_state_request: [{state: string; timestamp: number}];
  al_custom_event_request: [
    {
      eventName: string;
      level?: ALCustomEventLevel;
      attributes?: Readonly<Record<string, unknown>>;
      surface?: string;
      surfaceMetadata?: SurfaceMetadata;
    },
  ];
  al_screen_transition_request: [
    {
      timestamp: number;
      screen: string;
      screenId: string;
      previousScreen?: string;
      previousScreenId?: string;
      metadata?: SurfaceMetadata;
    },
  ];
  al_list_impression_request: [
    {
      timestamp: number;
      listName: string;
      itemName?: string;
      itemIndex?: number | null;
      surface?: string;
      surfaceMetadata?: SurfaceMetadata;
      metadata?: SurfaceMetadata;
    },
  ];
  al_deep_link_request: [
    {
      timestamp: number;
      targetURI: string;
      source: ALDeepLinkSource;
      metadata?: SurfaceMetadata;
    },
  ];
  al_react_error_request: [
    {
      timestamp: number;
      errorName: string;
      boundaryName?: string;
      errorCategory?: string;
      reactComponentStack?: readonly string[];
    },
  ];
};

export type ALChannel = Channel<ALChannelEventMap>;

interface ExternalSubscriber<EventName extends keyof ALChannelEventMap> {
  eventType: EventName;
  handler: (...args: ALChannelEventMap[EventName]) => void;
}

let channel: Channel<ALRuntimeChannelEventMap> | null = null;
const externalSubscribers: ExternalSubscriber<keyof ALChannelEventMap>[] = [];

export function initALChannel(): ALChannel {
  if (channel == null) {
    channel = new Channel<ALRuntimeChannelEventMap>();
    for (const subscriber of externalSubscribers) {
      channel.addListener(subscriber.eventType, subscriber.handler);
    }
  }
  return channel as unknown as ALChannel;
}

export function getALChannel(): ALChannel | null {
  return channel as unknown as ALChannel | null;
}

export function getALRuntimeChannel(): Channel<ALRuntimeChannelEventMap> | null {
  return channel;
}

export function addChannelSubscriber<
  EventName extends keyof ALChannelEventMap,
>(
  eventType: EventName,
  handler: (...args: ALChannelEventMap[EventName]) => void,
): () => void {
  const subscriber = {eventType, handler} as ExternalSubscriber<
    keyof ALChannelEventMap
  >;
  externalSubscribers.push(subscriber);
  channel?.addListener(eventType, handler);
  return () => {
    const index = externalSubscribers.indexOf(subscriber);
    if (index >= 0) externalSubscribers.splice(index, 1);
    channel?.removeListener(eventType, handler);
  };
}

export function resetALChannelForTests(): void {
  channel = null;
  externalSubscribers.length = 0;
}
