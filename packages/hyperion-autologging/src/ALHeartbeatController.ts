/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { ALHeartbeatType } from './ALHeartbeatType';

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
