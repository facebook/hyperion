/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';


import { ChannelEventType } from "@hyperion/hyperion-channel/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import { ALElementEvent, ALExtensibleEvent, ALLoggableEvent, ALMetadataEvent, ALSharedInitOptions } from "./ALType";
import * as ALUIEventPublisher from "./ALUIEventPublisher";
import { ALCustomEventChannel, emitALCustomEvent } from "./ALCustomEvent";
import * as ALSurfaceVisibilityPublisher from "./ALSurfaceVisibilityPublisher";
import { setEventExtension } from "./ALEventExtension";


type TrackingChannels = (ALUIEventPublisher.InitOptions & ALSurfaceVisibilityPublisher.InitOptions)['channel'];
type TrackingEvents = ChannelEventType<TrackingChannels>;
type TrackingEventNames = (keyof TrackingEvents) & ('al_ui_event' | 'al_surface_visibility_event'); // & is added to ensure the event names are a correct subset

export type ALChannelDOMSnapshotPublisherEvent = ChannelEventType<TrackingChannels & ALCustomEventChannel>;

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelDOMSnapshotPublisherEvent>
  & {
    eventConfig: (TrackingEventNames)[];
  }
>;

export function publish(options: InitOptions): void {
  const { channel, flowletManager } = options;

  function copyNodeStyle(sourceNode: HTMLElement, targetNode: HTMLElement) {
    const computedStyle = window.getComputedStyle(sourceNode);
    Array.from(computedStyle).forEach(key => targetNode.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key)))
  }
  function getSnapshot<T extends Node>(node: T): T {
    const clone = node.cloneNode() as T;
    if (clone instanceof HTMLElement && node instanceof HTMLElement) {
      copyNodeStyle(node, clone);
      for (let child = node.firstChild; child; child = child.nextSibling) {
        clone.appendChild(getSnapshot(child));
      }
    }
    return clone;
  }

  function takeEventSnapshot(eventData: Types.Nullable<ALElementEvent> & ALMetadataEvent & ALExtensibleEvent & ALLoggableEvent) {
    const { element } = eventData;
    if (!element) {
      return;
    }
    const clone = getSnapshot(element);
    const snapshot = clone.outerHTML;
    const customEvent = emitALCustomEvent(
      channel,
      flowletManager,
      {
        event_name: "dom_snapshot",
        snapshot,
      },
      {
        relatedEventIndex: eventData.eventIndex,
      }
    );
    eventData.metadata.snapshot_event_index = '' + customEvent.eventIndex;
    setEventExtension(eventData, 'autologging', { snapshot });
  }

  options.eventConfig.forEach(eventName => {
    switch (eventName) {
      case 'al_ui_event': {
        channel.addListener('al_ui_event', eventData => {
          if (eventData.event !== 'click') {
            return;
          }
          takeEventSnapshot(eventData);
        });
        break;
      }
      case 'al_surface_visibility_event': {
        channel.addListener('al_surface_visibility_event', takeEventSnapshot);
        break;
      }
    }
  });
} 