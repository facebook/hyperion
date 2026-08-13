/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { useSyncExternalStore } from 'react';
import {
  createTransportEnvelope,
  type ALModernChannelEventMap,
  type ALTransportEnvelope,
} from 'hyperion-react-native';
import { AUTO_LOGGING_CHANNEL, AUTO_LOGGING_CONFIG } from './AutoLoggingConfig';

export type EventType = keyof ALModernChannelEventMap;
type PublicEvent = ALModernChannelEventMap[EventType][0];

export interface DebugEvent {
  sequence: number;
  eventType: EventType;
  event: PublicEvent;
  envelope: ALTransportEnvelope<PublicEvent>;
}

const listeners = new Set<() => void>();
let nextSequence = 1;
let snapshot: readonly DebugEvent[] = Object.freeze([]);

function record<EventName extends EventType>(
  eventType: EventName,
  event: ALModernChannelEventMap[EventName][0]
): void {
  const publicEvent = event as PublicEvent;
  snapshot = Object.freeze([
    ...snapshot.slice(-249),
    {
      sequence: nextSequence++,
      eventType,
      event: publicEvent,
      envelope: createTransportEnvelope(
        eventType,
        publicEvent,
        AUTO_LOGGING_CONFIG.appName
      ),
    },
  ]);
  notifyListeners();
}

export const DEBUG_EVENT_TYPES: readonly EventType[] = Object.freeze([
  'al_ui_event',
  'al_surface_mutation_event',
  'al_heartbeat_event',
  'al_app_state_event',
  'al_screen_transition_event',
  'al_list_impression_event',
  'al_deep_link_event',
  'al_react_error_event',
]);

for (const eventType of DEBUG_EVENT_TYPES) {
  AUTO_LOGGING_CHANNEL.addListener(eventType, (event) =>
    record(eventType, event)
  );
}

export function clearDebugEvents(): void {
  snapshot = Object.freeze([]);
  notifyListeners();
}

function notifyListeners(): void {
  for (const listener of Array.from(listeners)) listener();
}

export function useDebugEvents(): readonly DebugEvent[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => snapshot
  );
}
