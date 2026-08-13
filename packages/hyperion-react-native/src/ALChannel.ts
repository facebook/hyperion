/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from 'hyperion-channel/src/Channel';
import type { ALHeartbeatType } from 'hyperion-autologging-shared';
import type {
  ALChannelEventMap,
  ALDeepLinkSource,
  SurfaceMetadata,
} from './ALTypes';
import type { ALSurfaceDataNode } from './ALSurface';

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
  al_surface_unmount_request: [SurfaceRequest & { mountedDuration: number }];
  al_heartbeat_request: [{ type: ALHeartbeatType; timestamp: number }];
  al_app_state_request: [{ state: string; timestamp: number }];
  al_screen_transition_request: [
    {
      timestamp: number;
      screen: string;
      screenId: string;
      previousScreen?: string;
      previousScreenId?: string;
      metadata?: SurfaceMetadata;
    }
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
    }
  ];
  al_deep_link_request: [
    {
      timestamp: number;
      targetURI: string;
      source: ALDeepLinkSource;
      metadata?: SurfaceMetadata;
    }
  ];
  al_react_error_request: [
    {
      timestamp: number;
      errorName: string;
      errorMessage?: string;
      errorStack?: string;
      boundaryName?: string;
      errorCategory?: string;
      reactComponentStack?: string;
    }
  ];
};

export type ALChannel = Channel<ALChannelEventMap>;

let runtimeChannel: Channel<ALRuntimeChannelEventMap> | null = null;

export function getALRuntimeChannel(): Channel<ALRuntimeChannelEventMap> | null {
  return runtimeChannel;
}

export function setALRuntimeChannel(
  channel: ALChannel
): Channel<ALRuntimeChannelEventMap> {
  runtimeChannel = channel as unknown as Channel<ALRuntimeChannelEventMap>;
  return runtimeChannel;
}

export function resetALRuntimeChannelForTests(): void {
  runtimeChannel = null;
}
