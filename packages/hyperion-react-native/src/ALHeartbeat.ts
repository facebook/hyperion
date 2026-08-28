/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { ALHeartbeatType } from 'hyperion-autologging/src/ALHeartbeatType';
import { REACT_NATIVE_APP_LIFECYCLE_PLUGIN } from './ALAppLifecycle';
import type { ALReactNativePlugin } from './ALRuntime';
import type { ALHeartbeatEventData, ALReactNativeEventMap } from './ALTypes';

export { ALHeartbeatType } from 'hyperion-autologging/src/ALHeartbeatType';

export const REACT_NATIVE_HEARTBEAT_PLUGIN = 'react-native-heartbeat';

export interface ReactNativeHeartbeatOptions {
  readonly heartbeatInterval?: number;
  readonly maxUserInactivityDuration?: number;
}

export function reactNativeHeartbeat<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(options: ReactNativeHeartbeatOptions = {}): ALReactNativePlugin<EventMap> {
  return {
    name: REACT_NATIVE_HEARTBEAT_PLUGIN,
    dependencies: [REACT_NATIVE_APP_LIFECYCLE_PLUGIN],
    install(channel, context) {
      const lifecycle = context.getAppLifecycle();
      if (lifecycle == null) {
        throw new Error(
          'React Native heartbeat requires reactNativeAppLifecycle().'
        );
      }
      const heartbeatInterval = options.heartbeatInterval ?? 30_000;
      const maxInactivity =
        options.maxUserInactivityDuration ?? heartbeatInterval * 4;
      let active = false;
      let lastHeartbeatTime = 0;
      let intervalHandle: ReturnType<typeof setInterval> | null = null;
      const publicChannel =
        channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>;

      const emitHeartbeat = (
        type: ALHeartbeatType,
        timestamp = context.now()
      ) => {
        if (timestamp - context.session.getLastActivityTime() > maxInactivity) {
          return;
        }
        const event: ALHeartbeatEventData = {
          ...context.eventFactory.createEvent({ eventTimestamp: timestamp }),
          event: 'heartbeat',
          heartbeatType: type,
        };
        publicChannel.emit('al_heartbeat_event', event);
        lastHeartbeatTime = timestamp;
      };
      const stopInterval = () => {
        if (intervalHandle == null) return;
        clearInterval(intervalHandle);
        intervalHandle = null;
      };
      const startInterval = () => {
        if (intervalHandle != null) return;
        intervalHandle = setInterval(
          () => emitHeartbeat(ALHeartbeatType.SCHEDULED),
          heartbeatInterval
        );
      };
      const removeStateListener = lifecycle.addListener(
        (state, previousState, timestamp) => {
          if (!active) return;
          if (state === 'active') {
            context.session.recordActivity(timestamp);
            emitHeartbeat(
              timestamp - lastHeartbeatTime >= heartbeatInterval
                ? ALHeartbeatType.REGAIN_PAGE_VISIBILITY
                : ALHeartbeatType.PAGE_FOCUS_GAINED,
              timestamp
            );
            startInterval();
          } else {
            if (previousState === 'active') {
              emitHeartbeat(ALHeartbeatType.PAGE_FOCUS_LOST, timestamp);
            }
            stopInterval();
          }
        }
      );

      return {
        start() {
          active = true;
          context.session.recordActivity();
          emitHeartbeat(ALHeartbeatType.START);
          const state = lifecycle.getCurrentState();
          if (state !== 'background' && state !== 'inactive') {
            startInterval();
          }
        },
        dispose() {
          if (active) emitHeartbeat(ALHeartbeatType.STOP);
          active = false;
          stopInterval();
          removeStateListener();
        },
      };
    },
  };
}

export default Object.freeze({
  ALHeartbeatType,
  reactNativeHeartbeat,
  REACT_NATIVE_HEARTBEAT_PLUGIN,
});
