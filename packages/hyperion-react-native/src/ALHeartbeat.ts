/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { createALHeartbeatController } from 'hyperion-autologging/src/ALHeartbeatController';
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
      let intervalHandle: ReturnType<typeof setInterval> | null = null;
      let lastHeartbeatTime = 0;
      const publicChannel =
        channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>;
      const emitHeartbeat = createALHeartbeatController(
        maxInactivity,
        (heartbeatType, timestamp) => {
          const event: ALHeartbeatEventData = {
            ...context.eventFactory.createEvent({ eventTimestamp: timestamp }),
            event: 'heartbeat',
            heartbeatType,
          };
          publicChannel.emit('al_heartbeat_event', event);
          lastHeartbeatTime = timestamp;
        },
        () => context.session.getLastActivityTime()
      );
      const stopInterval = () => {
        if (intervalHandle == null) return;
        clearInterval(intervalHandle);
        intervalHandle = null;
      };
      const startInterval = () => {
        if (intervalHandle != null) return;
        intervalHandle = setInterval(
          () => emitHeartbeat(ALHeartbeatType.SCHEDULED, context.now()),
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
          emitHeartbeat(ALHeartbeatType.START, context.now());
          const state = lifecycle.getCurrentState();
          if (state !== 'background' && state !== 'inactive') startInterval();
        },
        dispose() {
          if (active) emitHeartbeat(ALHeartbeatType.STOP, context.now());
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
