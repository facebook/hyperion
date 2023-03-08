/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";
import { TimedTrigger } from '@hyperion/hyperion-util/src/TimedTrigger';
import performanceAbsoluteNow from '@hyperion/hyperion-util/src/performanceAbsoluteNow';
import * as Types from "@hyperion/hyperion-util/src/Types";
import { ALChannelUIEvent } from "./ALUIEventPublisher";
import * as ALEventIndex from "./ALEventIndex";
import { ALLoggableEvent } from "./ALType";

export enum ALHeartbeatType {
  REGAIN_PAGE_VISIBILITY,
  SCHEDULED,
  START,
}

export type AdsALHeartbeatEventData = Readonly<
  ALLoggableEvent &
  {
    event: "heartbeat";
    heartbeatType: ALHeartbeatType;
  }>;

export type ALChannelHeartbeatEvent = Readonly<{
  al_heartbeat: [AdsALHeartbeatEventData],
}>;

export type ALHeartbeatChannel = Channel<ALChannelHeartbeatEvent & ALChannelUIEvent>;

export type InitOptions = Types.Options<{
  channel: ALHeartbeatChannel;
  heartbeatInterval?: number;
  maxUserInactivityDuration?: number;
}>;

const HEARTBEAT_INTERVAL = 30 * 1000 /* DateConsts.MS_PER_SEC */;
const MAX_USER_INACTIVITY_DURATION = 4 * HEARTBEAT_INTERVAL;
const VISIBILITY_CHANGE_EVENT = "visibilitychange";

let _lastHeartbeatTime: number = 0;
let _lastUserActionTime: number = performanceAbsoluteNow();
let _timedLogger: TimedTrigger | null = null;
let _options: InitOptions | null = null;
let _releaseListeners: (() => void) | null;


export function getInterval(): number {
  return _options?.heartbeatInterval ?? HEARTBEAT_INTERVAL;
}

export function getLastHeartbeatTime(): number {
  return _lastHeartbeatTime;
}

export function getLastUserActionTime(): number {
  return _lastUserActionTime;
}

function isActive(): boolean {
  return _timedLogger != null;
}

export function start(options: InitOptions): void {
  if (isActive()) {
    return;
  }
  _options = options;
  const { channel } = options;

  const userActionListener = channel.addListener(
    'al_ui_event',
    ({ eventTimestamp }) => {
      _lastUserActionTime = eventTimestamp;
    },
  );

  const pageVisibilityListener = (_e: Event) => {
    const isHidden = document.hidden;
    if (isHidden) {
      return; // Not interested in when page is hidden?
    }

    // Reset timers on coming back to the page if past the heartbeat interval  
    const timestamp = performanceAbsoluteNow();
    if (timestamp - _lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
      _lastUserActionTime = timestamp;
      _logHeartbeat(ALHeartbeatType.REGAIN_PAGE_VISIBILITY);
      if (isActive()) {
        _timedLogger?.delay(getInterval());
      } else {
        _scheduleNextHeartbeat();
      }
    }
  }
  document.addEventListener(VISIBILITY_CHANGE_EVENT, pageVisibilityListener);

  _releaseListeners = () => {
    document.removeEventListener(VISIBILITY_CHANGE_EVENT, pageVisibilityListener);
    channel.removeListener('al_ui_event', userActionListener);
  }
  _logHeartbeat(ALHeartbeatType.START);
  _scheduleNextHeartbeat();
}

export function stop(): void {
  if (!isActive()) {
    return;
  }
  if (_timedLogger != null) {
    _timedLogger.cancel();
    _timedLogger = null;
  }
  _releaseListeners?.();
}

function _logHeartbeat(heartbeatType: ALHeartbeatType): void {
  const timestamp = performanceAbsoluteNow();
  if (timestamp - _lastUserActionTime <= MAX_USER_INACTIVITY_DURATION) {
    _options?.channel.emit('al_heartbeat', {
      event: 'heartbeat',
      eventIndex: ALEventIndex.getNextEventIndex(),
      eventTimestamp: timestamp,
      // flowlet: AdsALFlowletManager.top(),
      heartbeatType,
    });
    _lastHeartbeatTime = timestamp;
  }
}

function _scheduleNextHeartbeat(): void {
  _timedLogger = new TimedTrigger(() => {
    if (!isActive()) {
      return;
    }
    _logHeartbeat(ALHeartbeatType.SCHEDULED);
    _scheduleNextHeartbeat();
  }, getInterval());
}
