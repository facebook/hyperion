/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import { Channel } from "@hyperion/hook/src/Channel";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import { TimedTrigger } from "@hyperion/hyperion-util/src/TimedTrigger";
import * as Types from "@hyperion/hyperion-util/src/Types";
import ALElementInfo from './ALElementInfo';
import { ALFlowlet, ALFlowletManagerInstance } from "./ALFlowletManager";
import { ALID, getOrSetAutoLoggingID } from "./ALID";
import { getElementName, getInteractable, trackInteractable } from "./ALInteractableDOMElement";
import { ReactComponentData } from "./ALReactUtils";
import { getSurfacePath } from "./ALSurfaceUtils";
import { ALFlowletEvent, ALReactElementEvent, ALSharedInitOptions, ALTimedEvent } from "./ALType";

/**
 * Generates a union type of all handler event and domEvent permutations.
 * e.g. {domEvent: KeyboardEvent, event: 'keydown', ...}
 */
type ALUIEvent<T = EventHandlerMap> = {
  [K in keyof T]: Readonly<{
    // The typed domEvent associated with the event we are capturing
    domEvent: T[K],
    // Event we are capturing
    event: K,
    // Element target associated with the domEvent
    element: HTMLElement | null,
    // Element text extracted from element
    elementName?: string | null,
    // Whether the event is generated from a user action or dispatched via script
    isTrusted: boolean,
  }>
}[keyof T];

export type ALUIEventCaptureData = Readonly<
  ALUIEvent &
  ALFlowletEvent &
  ALReactElementEvent &
  {
    captureTimestamp: number,
    surface: string | null,
    autoLoggingID: ALID | null,
  }
>;

export type ALUIEventBubbleData = Readonly<
  ALUIEvent &
  {
    bubbleTimestamp: number,
    autoLoggingID: ALID | null,
  }
>;

export type ALLoggableUIEvent = Readonly<
  ALTimedEvent &
  ALUIEvent &
  ALFlowletEvent &
  ALReactElementEvent &
  {
    autoLoggingID: ALID | null,
    surface?: string | null,
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

type EventHandlerMap = DocumentEventMap;

type UIEventConfig<T = EventHandlerMap> = {
  [K in keyof T]: Readonly<{
    eventName: K,
    // A callable filter for this event, returning true if the event should be emitted, or false if it should be discarded up front
    eventFilter?: (domEvent: T[K]) => boolean;
    // Whether to limit to elements that are "interactable", i.e. those that have event handlers registered to the element.  Defaults to true.
    interactableElementsOnly?: boolean;
    // Whether to cache element's react information on capture, defaults to false.
    cacheElementReactInfo?: boolean;
  }>
}[keyof T];

export type InitOptions = Types.Options<
  ALSharedInitOptions &
  {
    uiEvents: Array<UIEventConfig>;
    channel: ALChannel;
  }
>;

/**
 *
 * @param event - the event to check whether it's valid and we want to push/pop it on the flowlet stack
 * @returns boolean indicating if flowlet should be added/removed from stack
 * Whether to push/pop this event's flowlet via FlowletManager
 */
const shouldPushPopFlowlet = (event: Event) => event.bubbles && event.isTrusted;

const activeUIEventFlowlets = new Map<UIEventConfig['eventName'], ALFlowlet>();

/**
 *
 * @param options - Configuration for determining which events to capture and emit events via provided channel.
 * This function adds listeners for events via {@link window.document.addEventListener} (both capture and bubble phases),  and enriches these
 * events with multiple attributes, including react information.  Capturing of information
 * and filtering of events is configured via {@link UIEventConfig}.
 */
export function publish(options: InitOptions): void {
  const { uiEvents, flowletManager, channel, domSurfaceAttributeName } = options;


  const newEventsToPublish = uiEvents.filter(
    event => !PUBLISHED_EVENTS.has(event.eventName),
  );

  trackInteractable(newEventsToPublish.map(ev => ev.eventName));

  let lastUIEvent: CurrentUIEvent | null;
  const defaultTopFlowlet = new flowletManager.flowletCtor("/");

  newEventsToPublish.forEach((eventConfig => {
    const { eventName, eventFilter, cacheElementReactInfo = false, interactableElementsOnly = true } = eventConfig;
    // Track event in the capturing phase
    window.document.addEventListener(eventName, (event) => {
      const captureTimestamp = performanceAbsoluteNow();

      if (eventFilter && !eventFilter(event as any)) {
        return;
      }

      let element: HTMLElement | null = null;
      let autoLoggingID: ALID | null = null;
      if (interactableElementsOnly) {
        element = getInteractable(event.target, eventName);
        if (element == null) {
          return;
        }
        autoLoggingID = getOrSetAutoLoggingID(element);
      }
      else {
        element = event.target instanceof HTMLElement ? event.target : null;
      }

      const surface = getSurfacePath(element, domSurfaceAttributeName);
      /**
       * Regardless of element, we want to set the flowlet on this event.
       * If we do have an element, we include its id in the flowlet.
       * Since it is possible to interact with the same exact element multiple times,
       * we need yet another distinguishing fact, for which we use timestamp
       */
      const topFlowlet = flowletManager.top();
      let flowlet = topFlowlet ?? defaultTopFlowlet; // We want to ensure flowlet is always assigned
      if (shouldPushPopFlowlet(event)) {
        let flowletName = eventName + `(ts:${captureTimestamp}`;
        if (autoLoggingID) {
          flowletName += `,element:${autoLoggingID}`;
        }
        if (surface) {
          flowletName += `,surface:${surface}`;
        }
        flowletName += ')';
        flowlet = new flowletManager.flowletCtor(flowletName);
        ALFlowletManagerInstance.push(flowlet);
        flowlet = flowletManager.push(flowlet);
        activeUIEventFlowlets.set(eventName, flowlet);
      }
      let reactComponentData: ReactComponentData | null = null;
      if (element && cacheElementReactInfo) {
        const elementInfo = ALElementInfo.getOrCreate(element);
        reactComponentData = elementInfo.getReactComponentData();
      }
      const eventData: ALUIEventCaptureData = {
        domEvent: event,
        event: (eventName as any),
        element,
        captureTimestamp,
        flowlet,
        alFlowlet: flowlet.data.alFlowlet,
        isTrusted: event.isTrusted,
        surface,
        elementName: element ? getElementName(element) : null,
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
      (event) => {
        const bubbleTimestamp = performanceAbsoluteNow();

        if (eventFilter && !eventFilter(event as any)) {
          return;
        }

        let element: HTMLElement | null = null;
        let autoLoggingID: ALID | null = null;
        if (interactableElementsOnly) {
          element = getInteractable(event.target, eventName);
          if (element == null) {
            return;
          }
          autoLoggingID = getOrSetAutoLoggingID(element);
        }
        else {
          element = event.target instanceof HTMLElement ? event.target : null;
        }

        channel.emit('al_ui_event_bubble', {
          domEvent: event,
          event: (eventName as any),
          element,
          bubbleTimestamp,
          isTrusted: event.isTrusted,
          autoLoggingID,
        });

        /**
         * We want the actual event fire after all bubble listeners are done
         * Therefore, we fire the second one here, instead of registering a
         * listener for the bubble events.
         */
        if (lastUIEvent != null) {
          const { data, timedEmitter } = lastUIEvent;
          if (data.event === eventName && data.domEvent.target === event.target) {
            timedEmitter.run();
          }
        }

        let flowlet: ALFlowlet | undefined;
        if (shouldPushPopFlowlet(event) && (flowlet = activeUIEventFlowlets.get(eventName)) != null) {
          flowletManager.pop(flowlet);
          activeUIEventFlowlets.delete(eventName);
          ALFlowletManagerInstance.pop(flowlet);
        }
      },
      false, // useCapture
    );
  }));

  function updateLastUIEvent(eventData: ALUIEventCaptureData) {
    const { autoLoggingID, event, flowlet, captureTimestamp, element, elementName, isTrusted, reactComponentName, reactComponentStack, surface } = eventData;

    if (lastUIEvent != null) {
      const { timedEmitter } = lastUIEvent;
      timedEmitter.run();
    }

    const data: ALUIEventData = {
      // Capture event, should we include bubble as well?
      domEvent: eventData.domEvent,
      event: (event as any),
      element,
      elementName,
      eventTimestamp: captureTimestamp,
      autoLoggingID,
      flowlet,
      alFlowlet: flowlet.data.alFlowlet,
      isTrusted,
      reactComponentName,
      reactComponentStack,
      surface,
    };

    lastUIEvent = {
      data,
      timedEmitter: new TimedTrigger(_ => {
        channel.emit('al_ui_event', data);
        lastUIEvent = null;
      }, MAX_CAPTURE_TO_BUBBLE_DELAY_MS),
    };
  }

  newEventsToPublish.forEach(event => PUBLISHED_EVENTS.add(event.eventName));

  /**
   * We know the the flowlet.data is going to carry the async flow data based
   * on where each function was created.
   * We want to make sure that flow knows what is the actual corresponding
   * alflowlet which corresponds to execution code at runtime.
   * Since as of now we only start a new flowlet when there is a UI event, we
   * add the following code to say whenever a new flowlet is pushed (a.k.a a new async
   * context is started), we ensure that knows which alflowlet is responsible for it.
   *
   * To ensure this info carries forward, we look at the ALFlowletManagerInstance stack.
   * This mechanism works because of how various 'creation time flowlets' are pushed/popped on
   * the stack.
   */
  flowletManager.onPush.add((flowlet, _reason) => {
    const alFlowlet = ALFlowletManagerInstance.top();
    if (alFlowlet && flowlet.data.alFlowlet !== alFlowlet) {
      flowlet.data.alFlowlet = alFlowlet;
      if (flowlet.name === "useState" && flowlet.parent) {
        /**
         * We know that useState will trigger an update on the corresponding component
         * The parent of the useState's flowlet is 'usually' a surface flowlet.
         * That because useState is called within a render function, and render function's
         * flowlet will be picked up from the surface context.
         * If we update the surface's flowlet, then anything that mount/unmount under that
         * surface will pickup the correct flowlet.
         * Another alternative is to mark the surface's flowlet explicitily and here
         * look for that marking and updat the flowlet.
         *
         */
        flowlet.parent.data.alFlowlet = alFlowlet;
      }
    }
  })
}
