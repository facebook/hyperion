/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { ChannelEventType } from "@hyperion/hyperion-channel/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALEventIndex from "./ALEventIndex";
import { ALSharedInitOptions } from "./ALType";
import * as ALUIEventPublisher from "./ALUIEventPublisher";
import { ALUIEventCaptureData } from "./ALUIEventPublisher";


export type InitOptions = Types.Options<
  Pick<ALUIEventPublisher.InitOptions, 'uiEvents'> &
  Pick<ALSharedInitOptions<ChannelEventType<(ALUIEventPublisher.InitOptions)['channel']>>, 'channel'>
>;

export function publish(options: InitOptions): void {
  const { channel, uiEvents } = options;

  const mouseOverConfig = uiEvents.find(e => e.eventName === 'mouseover');
  // Won't refine below property durationThresholdToEmitHoverEvent as being available without eventName check
  if (mouseOverConfig == null || mouseOverConfig.eventName !== 'mouseover') {
    return;
  }

  const durationThresholdToEmitHoverEvent = mouseOverConfig.durationThresholdToEmitHoverEvent;
  if (durationThresholdToEmitHoverEvent == null) {
    return;
  }

  let activeHover: ALUIEventCaptureData | null = null;
  channel.addListener('al_ui_event_capture', eventData => {
    if (eventData.event === 'mouseover') {
      if (
        // Mousing over a new target and the activeHovers targetElement
        // is now the relatedTarget of the new event.
        // For mouseover:
        //    event.target (from hyperion, targetElement) – is the element where the mouse came over.
        //    event.relatedTarget – is the element from which the mouse came (relatedTarget → target).
        activeHover?.targetElement === eventData.domEvent?.relatedTarget
      ) {
        activeHover != null &&
          maybeEmitEvent(activeHover, eventData, durationThresholdToEmitHoverEvent);
      }
      // Set new active hover
      activeHover = eventData;
    }
    // Click should end active hover.
    // If the click is on an interactable element that contains the hovered element, then finish
    // the hover event, utilizing the click event timestamp
    else if (
      activeHover != null &&
      (eventData.event === 'click' || eventData.event === 'mousedown') &&
      // Clicked/Mousedown element (could be exact target or interactable parent) contains the active hover element
      eventData.element?.contains(activeHover.targetElement)
    ) {
      activeHover != null &&
        maybeEmitEvent(activeHover, eventData, durationThresholdToEmitHoverEvent);
      // Reset the active hover
      activeHover = null;
    }
  });

  function maybeEmitEvent(
    startEventData: ALUIEventCaptureData,
    leaveEventData: ALUIEventCaptureData,
    hoverDurationThresholdMS: number,
  ): void {
    const hoverDuration =
      leaveEventData.eventTimestamp - startEventData.eventTimestamp;
    if (hoverDuration > hoverDurationThresholdMS) {
      // Should refine, since it's only assigned from mouseover
      const domEvent = startEventData.domEvent as MouseEvent;
      channel.emit('al_ui_event',
        {
          ...startEventData,
          metadata: {
            ...startEventData.metadata,
            hover_duration_ms: hoverDuration.toString(),
          },
          domEvent: domEvent,
          eventIndex: ALEventIndex.getNextEventIndex(),
          event: 'hover',
        }
      );
    }
  }
}
