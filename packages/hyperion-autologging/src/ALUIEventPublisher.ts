/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import { Flowlet } from "@hyperion/hyperion-flowlet/src/Flowlet";
import { TimedTrigger } from "@hyperion/hyperion-util/src/TimedTrigger";
import { getElementName, getInteractable, trackInteractable, trackSynthetic } from "./ALInteractableDOMElement";
import { ALFlowletManager, ALFlowlet } from "./ALFlowletManager";
import { getSurfacePath } from "./ALSurfaceUtils";
import { getOrSetAutoLoggingID } from "@hyperion/hyperion-util/src/ALIDUtils";
import { Channel } from "@hyperion/hook/src/Channel";

export type ALUIEventCaptureData = Readonly<{
  event: string,
  element: Element,
  isTrusted: boolean,
  flowlet: Flowlet,
  captureTimestamp: number,
  surface: string | null,
  elementName: string | null,
}>;

export type ALUIEventBubbleData = Readonly<{
  event: string,
  element: Element,
  isTrusted: boolean,
  bubbleTimestamp: number,
}>;

export type ALUIEventData = Readonly<{
  event: string,
  element: Element,
  isTrusted: boolean,
  flowlet: Flowlet,
  eventIndex: number,
  eventTimestamp: number,
  autoLoggingID: string,
  surface?: string,
}>;

export type ALChannelUIEvent = Readonly<{
  al_ui_event_capture: [ALUIEventCaptureData],
  al_ui_event_bubble: [ALUIEventBubbleData],
  al_ui_event: [ALUIEventData],
}>;

const MAX_CAPTURE_TO_BUBBLE_DELAY_MS = 500;

type CurrentUIEvent = {
  data: ALUIEventData,
  timedEmitter: TimedTrigger,
};

const PUBLISHED_EVENTS = new Set<string>();
type ALChannel = Channel<ALChannelUIEvent>;

export function publish(
  uiEvents: Array<string>,
  FlowletManager: ALFlowletManager,
  channel: ALChannel,
): void {
  const newEventsToPublish = uiEvents.filter(
    event => !PUBLISHED_EVENTS.has(event),
  );

  trackInteractable(newEventsToPublish);

  let lastUIEvent: CurrentUIEvent | null;
  let flowlet: ALFlowlet;

  newEventsToPublish.forEach(eventName => {
    trackSynthetic(eventName);
    // Track event in the capturing phase
    window.document.addEventListener(
      eventName,
      (event: Event) => {
        const element = getInteractable(event.target, eventName);

        if (element == null) {
          return;
        }
        const captureTimestamp = Date.now();

        /**
         * Regardless of element, we want to set the flowlet on this event.
         * If we do have an element, we include its id in the flowlet.
         * Since it is possible to interact with the same exact element multiple times,
         * we need yet another distinguishing fact, for which we use timestamp
         */
        const ALFlowlet = FlowletManager.flowletCtor;
        flowlet = new ALFlowlet(eventName, FlowletManager.top());
        flowlet = new ALFlowlet(`ts${captureTimestamp}`, flowlet);
        flowlet = FlowletManager.push(flowlet);

        const eventData: ALUIEventCaptureData = {
          event: eventName,
          element,
          captureTimestamp,
          flowlet,
          isTrusted: event.isTrusted,
          surface: getSurfacePath(element),
          elementName: getElementName(element),
        };
        channel?.emit('al_ui_event_capture', eventData);
        updateLastUIEvent(eventData);
      },
      true, // useCapture
    );
    // Track event in the bubbling phase
    window.document.addEventListener(
      eventName,
      (event: Event) => {
        const element = getInteractable(event.target, eventName);
        if (element != null) {
          channel?.emit('al_ui_event_bubble', {
            event: eventName,
            element,
            bubbleTimestamp: Date.now(),
            isTrusted: event.isTrusted,
          });

          /**
           * We want the actual event fire after all bubble listeners are done
           * Therefore, we fire the second one here, instead of registering a
           * listener for the bubble events.
           */
          if (lastUIEvent != null) {
            const { data, timedEmitter } = lastUIEvent;
            if (data.event === eventName && data.element === element) {
              timedEmitter.run();
            }
          }
        }
        FlowletManager.pop(flowlet);
      },
      false, // useCapture
    );
  });

  function updateLastUIEvent(eventData: ALUIEventCaptureData) {
    const { event, captureTimestamp, element, isTrusted } = eventData;

    if (lastUIEvent != null) {
      const { timedEmitter } = lastUIEvent;
      timedEmitter.run();
    }

    const data: ALUIEventData = {
      event,
      element,
      eventTimestamp: captureTimestamp,
      autoLoggingID: getOrSetAutoLoggingID(element),
      flowlet,
      isTrusted,
      eventIndex: 0,
      // This will be overridden in the subscriber, we are passing in a value here because
      // Flow requires it but because some al_ui_events will be filtered out before emitting
      // events to Falco, we can't generate the event_index here
    };

    lastUIEvent = {
      data,
      timedEmitter: new TimedTrigger(_ => {
        channel?.emit('al_ui_event', data);
        lastUIEvent = null;
      }, MAX_CAPTURE_TO_BUBBLE_DELAY_MS),
    };
  }

  // if (channel) {
  //   onALUIEventCapture.add(event => channel.emit('al_ui_event_capture', event));
  //   onALUIEventBubble.add(event => channel.emit('al_ui_event_bubble', event));
  //   onALUIEvent.add(event => channel.emit('al_ui_event', event));
  // }

  newEventsToPublish.forEach(event => PUBLISHED_EVENTS.add(event));
}
