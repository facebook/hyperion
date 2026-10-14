/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { ALLoggableEvent, ALMetadataValue } from './ALCommonTypes';

export enum ALHeartbeatType {
  REGAIN_PAGE_VISIBILITY = 'REGAIN_PAGE_VISIBILITY',
  PAGE_FOCUS_GAINED = 'PAGE_FOCUS_GAINED',
  PAGE_FOCUS_LOST = 'PAGE_FOCUS_LOST',
  SCHEDULED = 'SCHEDULED',
  START = 'START',
  STOP = 'STOP',
}

export type ALHeartbeatEventData<MetadataValue = ALMetadataValue> =
  ALLoggableEvent<MetadataValue> &
    Readonly<{
      event: 'heartbeat';
      heartbeatType: ALHeartbeatType;
    }>;

export type ALChannelHeartbeatEvent<MetadataValue = ALMetadataValue> =
  Readonly<{
    al_heartbeat_event: [ALHeartbeatEventData<MetadataValue>];
  }>;

export type ALHeartbeatController = (
  heartbeatType: ALHeartbeatType,
  timestamp: number
) => void;

export function createALHeartbeatController(
  maxUserInactivityDuration: number,
  publishHeartbeat: (heartbeatType: ALHeartbeatType, timestamp: number) => void,
  getLastUserActionTime: () => number
): ALHeartbeatController {
  return (heartbeatType: ALHeartbeatType, timestamp: number) => {
    if (timestamp - getLastUserActionTime() <= maxUserInactivityDuration) {
      publishHeartbeat(heartbeatType, timestamp);
    }
  };
}
