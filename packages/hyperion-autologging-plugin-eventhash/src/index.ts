/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import { ALNetworkRequestEvent, ALNetworkResponseEvent } from "hyperion-autologging/src/ALNetworkPublisher";
import { ALSurfaceMutationEventData } from "hyperion-autologging/src/ALSurfaceMutationPublisher";
import { ALSurfaceVisibilityEventData } from "hyperion-autologging/src/ALSurfaceVisibilityPublisher";
import { ALMetadataEvent, Metadata } from "hyperion-autologging/src/ALType";
import { ALUIEventData } from "hyperion-autologging/src/ALUIEventPublisher";
import type { ALChannelEvent } from "hyperion-autologging/src/AutoLogging";
import { Channel } from "hyperion-channel";
import * as XXH from "xxhashjs"

const xxh = XXH.h64(0xABCD);
type Digits = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

type EventTypes = ALUIEventData['event']
  | ALSurfaceMutationEventData['event']
  | ALSurfaceVisibilityEventData['event']
  | ALNetworkRequestEvent['event']
  | ALNetworkResponseEvent['event'];

const EventSymbol = {
  click: "$00:",
  mount_component: "$01:",
  unmount_component: "$02:",
  hover: "$03:",
  scroll: "$04:",
  keypress: "$05:",
  input: "$06:",
  focus: "$07:",
  blur: "$08:",
  change: "$09:",
  surface_visible: "$10:",
  surface_hidden: "$11:",
  network_request: "$12:",
  network_response: "$13:",
} as const as Record<EventTypes, `$${Digits}${Digits}:` | undefined>;

export function addMetadataHash(metadata: Metadata, metadataKey: string, event: EventTypes, param: string | null): string | null {
  const eventSymbol = EventSymbol[event];
  if (eventSymbol && param) {
    const hash = eventSymbol + xxh.update(param).digest().toString(16);
    metadata[metadataKey] = hash;
    return hash;
  }
  return null;
}

export function init(channel: Channel<ALChannelEvent>): void {
  function addEventHash(eventData: ALMetadataEvent, event: EventTypes, param: string | null): void {
    addMetadataHash(eventData.metadata, 'hash', event, param);
  }

  channel.addListener('al_ui_event', eventData => {
    addEventHash(eventData, eventData.event, eventData.surface);
    addMetadataHash(eventData.metadata, 'hash1', eventData.event, `${eventData.pageURI.pathname},${eventData.surface ?? ''},${eventData.reactComponentName ?? ''},${eventData.elementName ?? ''} `);
  });

  channel.addListener('al_surface_mutation_event', eventData => {
    addEventHash(eventData, eventData.event, eventData.surface);
  });

  channel.addListener('al_surface_visibility_event', eventData => {
    addEventHash(eventData, eventData.event, eventData.surface);
  });

  channel.addListener('al_network_request', eventData => {
    addEventHash(eventData, eventData.event, eventData.uri.pathname);
  });

  channel.addListener('al_network_response', eventData => {
    addEventHash(eventData, eventData.event, eventData.requestEvent.uri.pathname);
  });

}