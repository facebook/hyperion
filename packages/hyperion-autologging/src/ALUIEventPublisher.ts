/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import { Channel } from "@hyperion/hook/src/Channel";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import { TimedTrigger } from "@hyperion/hyperion-util/src/TimedTrigger";
import * as Types from "@hyperion/hyperion-util/src/Types";
import { ALFlowlet, ALFlowletManager } from "./ALFlowletManager";
import { ALID, getOrSetAutoLoggingID } from "./ALID";
import { getElementName, getInteractable, trackInteractable } from "./ALInteractableDOMElement";
import { ComponentNameValidator, getReactComponentData_THIS_CAN_BREAK, ReactComponentData } from "./ALReactUtils";
import { AUTO_LOGGING_SURFACE } from "./ALSurfaceConsts";
import { getSurfacePath } from "./ALSurfaceUtils";
import { ALFlowletEvent, ALReactElementEvent, ALTimedEvent } from "./ALType";

export type ALUIEvent = Readonly<{
  event: string,
  element: Element,
  elementName?: string | null,
  isTrusted: boolean,
}>;

export type ALUIEventCaptureData = Readonly<
  ALUIEvent &
  ALFlowletEvent &
  ALReactElementEvent &
  ALFlowletEvent &
  {
    captureTimestamp: number,
    surface: string | null,
    autoLoggingID: ALID
  }
>;

export type ALUIEventBubbleData = Readonly<
  ALUIEvent &
  {
    bubbleTimestamp: number,
  }
>;

type ALLoggableUIEvent = Readonly<
  ALTimedEvent &
  ALUIEvent &
  ALFlowletEvent &
  ALReactElementEvent &
  {
    autoLoggingID: ALID,
    surface?: string,
  }
>;

export type ALUIEventData = Readonly<
  ALLoggableUIEvent
>;

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

export type InitOptions = Types.Options<{
  uiEvents: Array<string>;
  flowletManager: ALFlowletManager;
  channel: ALChannel;
  cacheElementReactInfo: boolean;
  domSurfaceAttributeName?: string;
  componentNameValidator?: ComponentNameValidator;
}>;

export function publish(options: InitOptions): void {
  const { uiEvents, flowletManager, channel, domSurfaceAttributeName = AUTO_LOGGING_SURFACE, cacheElementReactInfo, componentNameValidator = null } = options;

  const newEventsToPublish = uiEvents.filter(
    event => !PUBLISHED_EVENTS.has(event),
  );

  trackInteractable(newEventsToPublish);

  let lastUIEvent: CurrentUIEvent | null;
  let flowlet: ALFlowlet;

  newEventsToPublish.forEach(eventName => {
    // Track event in the capturing phase
    window.document.addEventListener(eventName, (event: Event) => {
      const element = getInteractable(event.target, eventName);

      if (element == null) {
        return;
      }
      const captureTimestamp = performanceAbsoluteNow();

      /**
       * Regardless of element, we want to set the flowlet on this event.
       * If we do have an element, we include its id in the flowlet.
       * Since it is possible to interact with the same exact element multiple times,
       * we need yet another distinguishing fact, for which we use timestamp
       */
      const autoLoggingID = getOrSetAutoLoggingID(element);
      if (event.isTrusted && event.bubbles) {
        const ALFlowlet = flowletManager.flowletCtor;
        flowlet = new ALFlowlet(eventName, flowletManager.top());
        flowlet = new ALFlowlet(autoLoggingID, flowlet);
        flowlet = new ALFlowlet(`ts${captureTimestamp}`, flowlet);
        flowlet = flowletManager.push(flowlet);
      }
      let reactComponentData: ReactComponentData | null = null;
      if (cacheElementReactInfo) {
        reactComponentData = getReactComponentData_THIS_CAN_BREAK(element, componentNameValidator);
      }
      const eventData: ALUIEventCaptureData = {
        event: eventName,
        element,
        captureTimestamp,
        flowlet,
        isTrusted: event.isTrusted,
        surface: getSurfacePath(element, domSurfaceAttributeName),
        elementName: getElementName(element),
        reactComponentName: reactComponentData?.name,
        reactComponentStack: reactComponentData?.stack,
        autoLoggingID
      };
      channel.emit('al_ui_event_capture', eventData);
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
          channel.emit('al_ui_event_bubble', {
            event: eventName,
            element,
            bubbleTimestamp: performanceAbsoluteNow(),
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
        if (event.isTrusted) {
          flowletManager.pop(flowlet);
        }
      },
      false, // useCapture
    );
  });

  function updateLastUIEvent(eventData: ALUIEventCaptureData) {
    const { event, captureTimestamp, element, elementName, isTrusted, reactComponentName, reactComponentStack } = eventData;

    if (lastUIEvent != null) {
      const { timedEmitter } = lastUIEvent;
      timedEmitter.run();
    }

    const data: ALUIEventData = {
      event,
      element,
      elementName,
      eventTimestamp: captureTimestamp,
      autoLoggingID: getOrSetAutoLoggingID(element),
      flowlet,
      isTrusted,
      reactComponentName,
      reactComponentStack,
    };

    lastUIEvent = {
      data,
      timedEmitter: new TimedTrigger(_ => {
        channel.emit('al_ui_event', data);
        lastUIEvent = null;
      }, MAX_CAPTURE_TO_BUBBLE_DELAY_MS),
    };
  }

  newEventsToPublish.forEach(event => PUBLISHED_EVENTS.add(event));
}
