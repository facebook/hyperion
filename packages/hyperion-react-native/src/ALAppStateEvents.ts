/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { AutoLoggingChannel } from 'hyperion-autologging/src/ALChannel';
import { REACT_NATIVE_APP_LIFECYCLE_PLUGIN } from './ALAppLifecycle';
import type { ALReactNativePlugin } from './ALRuntime';
import type { ALAppStateEventData, ALReactNativeEventMap } from './ALTypes';

export function reactNativeAppStateEvents<
  EventMap extends ALReactNativeEventMap = ALReactNativeEventMap
>(): ALReactNativePlugin<EventMap> {
  return {
    name: 'react-native-app-state-events',
    dependencies: [REACT_NATIVE_APP_LIFECYCLE_PLUGIN],
    install(channel, context) {
      const lifecycle = context.getAppLifecycle();
      if (lifecycle == null) {
        throw new Error(
          'React Native app-state events require reactNativeAppLifecycle().'
        );
      }
      let active = false;
      const publicChannel =
        channel as unknown as AutoLoggingChannel<ALReactNativeEventMap>;
      const removeListener = lifecycle.addListener(
        (state, _previous, timestamp) => {
          if (!active) return;
          const event: ALAppStateEventData = {
            ...context.eventFactory.createEvent({ eventTimestamp: timestamp }),
            event: 'app_state_change',
            appState: state,
          };
          publicChannel.emit('al_app_state_event', event);
        }
      );
      return {
        start() {
          active = true;
        },
        dispose() {
          active = false;
          removeListener();
        },
      };
    },
  };
}
