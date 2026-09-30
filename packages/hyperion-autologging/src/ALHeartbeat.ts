/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "hyperion-channel/src/Channel";
import { TimedTrigger } from 'hyperion-timed-trigger/src/TimedTrigger';
import performanceAbsoluteNow from 'hyperion-util/src/performanceAbsoluteNow';
import * as Types from "hyperion-util/src/Types";
import { ALChannelUIEvent } from "./ALUIEventPublisher";
import * as ALEventIndex from "./ALEventIndex";
import * as ALInteractableDOMElement from "./ALInteractableDOMElement";
import { createALHeartbeatController } from './ALHeartbeatController';
import { ALHeartbeatType, type ALHeartbeatEventData } from "./ALHeartbeatType";

export { ALHeartbeatType } from "./ALHeartbeatType";

export type AdsALHeartbeatEventData = ALHeartbeatEventData<string>;

export type ALChannelHeartbeatEvent = Readonly<{
  al_heartbeat_event: [AdsALHeartbeatEventData],
}>;

export type ALHeartbeatChannel = Channel<ALChannelHeartbeatEvent & ALChannelUIEvent>;

export type InitOptions = Types.Options<
  {
    channel: ALHeartbeatChannel;
    heartbeatInterval?: number;
    maxUserInactivityDuration?: number;
  }
>;

const HEARTBEAT_INTERVAL = 30 * 1000 /* DateConsts.MS_PER_SEC */;
const MAX_USER_INACTIVITY_DURATION = 4 * HEARTBEAT_INTERVAL;
const VISIBILITY_CHANGE_EVENT = "visibilitychange";

let _options: InitOptions | null = null;
let _releaseListeners: (() => void) | null;
let _timedLogger: TimedTrigger | null = null;
let _lastHeartbeatTime = 0;
let _lastUserActionTime = performanceAbsoluteNow();


export function getInterval(): number {
  return _options?.heartbeatInterval ?? HEARTBEAT_INTERVAL;
}

const emitHeartbeat = createALHeartbeatController(
  MAX_USER_INACTIVITY_DURATION,
  (heartbeatType, timestamp) => {
    _options?.channel.emit('al_heartbeat_event', {
      event: 'heartbeat',
      eventIndex: ALEventIndex.getNextEventIndex(),
      eventTimestamp: timestamp,
      heartbeatType,
      metadata: {},
    });
    _lastHeartbeatTime = timestamp;
  },
  () => _lastUserActionTime
);

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
    if (timestamp - getLastHeartbeatTime() >= HEARTBEAT_INTERVAL) {
      _lastUserActionTime = timestamp;
      emitHeartbeat(
        ALHeartbeatType.REGAIN_PAGE_VISIBILITY,
        performanceAbsoluteNow()
      );
      if (isActive()) {
        _timedLogger?.delay(getInterval());
      } else {
        _scheduleNextHeartbeat();
      }
    }
  }
  document.addEventListener(VISIBILITY_CHANGE_EVENT, pageVisibilityListener);


  /**
   * Note that we use focus/blure instead of focusin/focusout because we don't want to events bubbling from descendant elements
   */
  let focusHandler;
  window.addEventListener(
    'focus',
    focusHandler = () => emitHeartbeat(ALHeartbeatType.PAGE_FOCUS_GAINED, performanceAbsoluteNow()),
    ALInteractableDOMElement.SafeBubbleEventListenerOptions
  );
  let blurHandler;
  window.addEventListener(
    'blur',
    blurHandler = () => emitHeartbeat(ALHeartbeatType.PAGE_FOCUS_LOST, performanceAbsoluteNow()),
    ALInteractableDOMElement.SafeBubbleEventListenerOptions
  );


  _releaseListeners = () => {
    document.removeEventListener(VISIBILITY_CHANGE_EVENT, pageVisibilityListener);
    window.removeEventListener('focus', focusHandler, ALInteractableDOMElement.SafeBubbleEventListenerOptions);
    window.removeEventListener('blur', blurHandler, ALInteractableDOMElement.SafeBubbleEventListenerOptions);
    channel.removeListener('al_ui_event', userActionListener);
  }
  emitHeartbeat(ALHeartbeatType.START, performanceAbsoluteNow());
  _scheduleNextHeartbeat();

  window.addEventListener('beforeunload', () => {
    // Just in case there are other cleanup work, wait one micro-task and send last heartbeat
    Promise.resolve().then(stop);
  });
}

export function stop(): void {
  if (!isActive()) {
    return;
  }
  _timedLogger?.cancel();
  _timedLogger = null;
  _releaseListeners?.();
  emitHeartbeat(ALHeartbeatType.STOP, performanceAbsoluteNow());
}

function _scheduleNextHeartbeat(): void {
  _timedLogger = new TimedTrigger(() => {
    if (!isActive()) return;
    emitHeartbeat(
      ALHeartbeatType.SCHEDULED,
      performanceAbsoluteNow()
    );
    _scheduleNextHeartbeat();
  }, getInterval());
}
