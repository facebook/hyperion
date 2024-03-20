/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import type * as Types from "@hyperion/hyperion-util/src/Types";

import { Channel } from "@hyperion/hook/src/Channel";
import { intercept } from "@hyperion/hyperion-core/src/intercept";
import * as IEvent from "@hyperion/hyperion-dom/src/IEvent";
import { setTriggerFlowlet } from "@hyperion/hyperion-flowlet/src/TriggerFlowlet";
import { TimedTrigger } from "@hyperion/hyperion-util/src/TimedTrigger";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import ALElementInfo from './ALElementInfo';
import { ALFlowletManager, IALFlowlet } from "./ALFlowletManager";
import { ALID, getOrSetAutoLoggingID } from "./ALID";
import { ALElementTextEvent, getElementTextEvent, getInteractable, isTrackedEvent, enableUIEventHandlers, TrackEventHandlerConfig } from "./ALInteractableDOMElement";
import { ReactComponentData } from "./ALReactUtils";
import { getSurfacePath } from "./ALSurfaceUtils";
import { ALFlowletEvent, ALMetadataEvent, ALReactElementEvent, ALSharedInitOptions, ALTimedEvent } from "./ALType";
import * as ALUIEventGroupPublisher from "./ALUIEventGroupPublisher";

/**
 * Generates a union type of all handler event and domEvent permutations.
 * e.g. {domEvent: KeyboardEvent, event: 'keydown', ...}
 */
type ALUIEvent<T = EventHandlerMap> = ALTimedEvent & ALMetadataEvent & {
  [K in keyof T]: Readonly<{
    // The typed domEvent associated with the event we are capturing
    domEvent: T[K],
    // Event we are capturing
    event: K,
    // Element target associated with the domEvent; With interactableElementsOnly, will be the interactable element target.
    element: HTMLElement | null,
    // Whether the event is generated from a user action or dispatched via script
    isTrusted: boolean,
    // The underlying identifier assigned to this element
    autoLoggingID: ALID | null,
  }>
}[keyof T];

export type ALUIEventCaptureData = Readonly<
  ALUIEvent &
  ALFlowletEvent &
  ALReactElementEvent &
  ALElementTextEvent &
  {
    surface: string | null,
  }
>;

export type ALUIEventBubbleData = Readonly<
  ALUIEvent
>;

export type ALLoggableUIEvent = Readonly<
  ALUIEventCaptureData
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

type ALChannel = Channel<ALChannelUIEvent>;

type EventHandlerMap = DocumentEventMap;

export type UIEventConfig<T = EventHandlerMap> = {
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

type CommonEventData = (ALUIEvent & ALTimedEvent) & {
  // The event.target element,  as opposed to element which represents the interactableElement
  targetElement: HTMLElement | null,
};

// Entrypoint to set up tracking and enable handlers
export function trackAndEnableUIEventHandlers(eventName: UIEventConfig['eventName'], eventHandlerConfig: Omit<TrackEventHandlerConfig, 'active'>): void {
  const config = { active: false, ...eventHandlerConfig };
  enableUIEventHandlers(eventName, config);
}

/**
 *
 * @param event - the event to check whether it's valid and we want to push/pop it on the flowlet stack
 * @returns boolean indicating if flowlet should be added/removed from stack
 * Whether to push/pop this event's flowlet via FlowletManager
 */
const shouldPushPopFlowlet = (event: Event) => event.bubbles && event.isTrusted;

const activeUIEventFlowlets = new Map<UIEventConfig['eventName'], IALFlowlet>();

const uiEventFlowletManager = new ALFlowletManager();

function getCommonEventData<T extends keyof DocumentEventMap>(eventConfig: UIEventConfig<DocumentEventMap>, eventName: T, event: DocumentEventMap[T]): CommonEventData | null {
  const eventTimestamp = performanceAbsoluteNow();

  const { eventFilter, interactableElementsOnly = true } = eventConfig;

  if (eventFilter && !eventFilter(event as any)) {
    return null;
  }

  let element: HTMLElement | null = null;
  let autoLoggingID: ALID | null = null;
  if (interactableElementsOnly) {
    /**
     * Because of how UI events work in browser, one could for example click anywhere
     * on a sub-tree an element and the event handler of that element will handle the event
     * once the event "bublles" to it.
     * For interactable elements, first we walk as high up the DOM tree as we can
     * to find the actuall element on which the original event handler was added.
     * We use that as the base of event to ensure the text, surface, ... for events
     * remain consistent no matter where the user actually clicked, hovered, ...
     */
    element = getInteractable(event.target, eventName, true);
    if (element == null) {
      return null;
    }
    autoLoggingID = getOrSetAutoLoggingID(element);
  }
  else {
    element = event.target instanceof HTMLElement ? event.target : null;
  }

  return {
    domEvent: event,
    event: (eventName as any),
    element,
    targetElement: event.target instanceof HTMLElement ? event.target : null,
    eventTimestamp,
    isTrusted: event.isTrusted,
    autoLoggingID,
    metadata: {},
  };
}

/**
 *
 * @param options - Configuration for determining which events to capture and emit events via provided channel.
 * This function adds listeners for events via {@link window.document.addEventListener} (both capture and bubble phases),  and enriches these
 * events with multiple attributes, including react information.  Capturing of information
 * and filtering of events is configured via {@link UIEventConfig}.
 */
export function publish(options: InitOptions): void {
  const { uiEvents, flowletManager, channel } = options;

  let lastUIEvent: CurrentUIEvent | null;

  uiEvents.forEach((eventConfig => {
    const { eventName, cacheElementReactInfo = false } = eventConfig;

    // the following will ensure that repeated items in the list won't have double handlers
    if (isTrackedEvent(eventName)) {
      // Already handled
      return;
    }

    // Track event in the capturing phase
    const captureHandler = (event: Event): void => {
      const uiEventData = getCommonEventData(eventConfig, eventName, event);
      if (!uiEventData) {
        return;
      }
      const { element, targetElement, autoLoggingID } = uiEventData;

      const surface = getSurfacePath(targetElement);
      /**
       * Regardless of element, we want to set the flowlet on this event.
       * If we do have an element, we include its id in the flowlet.
       * Since it is possible to interact with the same exact element multiple times,
       * we need yet another distinguishing fact, for which we rely on flowlet id to be part of the name
       */
      let flowletName = eventName + `(`;
      let separator = '';
      if (surface) {
        flowletName += `${separator}surface=${surface}`;
        separator = '&';
      }
      if (autoLoggingID) {
        flowletName += `${separator}element=${autoLoggingID}`;
      }
      flowletName += ')';
      let flowlet = new flowletManager.flowletCtor(flowletName, ALUIEventGroupPublisher.getGroupRootFlowlet(event));
      if (shouldPushPopFlowlet(event)) {
        uiEventFlowletManager.push(flowlet);
        flowlet = flowletManager.push(flowlet);
        activeUIEventFlowlets.set(eventName, flowlet);
      }
      let reactComponentData: ReactComponentData | null = null;
      if (targetElement && cacheElementReactInfo) {
        const elementInfo = ALElementInfo.getOrCreate(targetElement);
        reactComponentData = elementInfo.getReactComponentData();
      }
      const elementText = getElementTextEvent(element, surface);
      const eventData: ALUIEventCaptureData = {
        ...uiEventData,
        flowlet,
        triggerFlowlet: flowlet,
        surface,
        ...elementText,
        reactComponentName: reactComponentData?.name,
        reactComponentStack: reactComponentData?.stack,
      };
      updateLastUIEvent(eventData);
      intercept(event); // making sure we can track changes to the Event object
      setTriggerFlowlet(event, flowlet);
      channel.emit('al_ui_event_capture', eventData);
    };

    /**
     * If any of the actual event handlers call stopPropagation, we know that
     * our bubble handler will not be called, so we trigger it rightaway
     */
    IEvent.stopPropagation.onBeforeCallObserverAdd(function (this) {
      if (lastUIEvent != null && lastUIEvent.data.domEvent === this) {
        lastUIEvent.data.metadata.propagation_was_stopped = "true";
        lastUIEvent.timedEmitter.run();
      }
    });

    // Track event in the bubbling phase
    const bubbleHandler = (event: Event): void => {
      const uiEventData = getCommonEventData(eventConfig, eventName, event);
      if (!uiEventData) {
        return;
      }

      channel.emit('al_ui_event_bubble', uiEventData);

      /**
       * We want the actual event fire after all bubble listeners are done
       * Therefore, we fire the second one here, instead of registering a
       * listener for the bubble events.
       */
      if (lastUIEvent != null) {
        const { data, timedEmitter } = lastUIEvent;
        if (data.event === eventName && data.domEvent.target === event.target) {
          /**
           * In case during al_ui_event_bubble subscribers have updated the
           * metadata of the event, we combine them into the metadata of the
           * al_ui_event_capture event.
           */
          Object.assign(data.metadata, uiEventData.metadata);
          timedEmitter.run();
        }
      }

      let flowlet: IALFlowlet | undefined;
      if (shouldPushPopFlowlet(event) && (flowlet = activeUIEventFlowlets.get(eventName)) != null) {
        flowletManager.pop(flowlet);
        activeUIEventFlowlets.delete(eventName);
        uiEventFlowletManager.pop(flowlet);
      }
    };

    // Enable the events handlers as well as interactable tracking
    trackAndEnableUIEventHandlers(eventName, {
      captureHandler,
      bubbleHandler,
    });
  }));

  function updateLastUIEvent(eventData: ALUIEventCaptureData) {
    if (lastUIEvent != null) {
      const { timedEmitter } = lastUIEvent;
      timedEmitter.run();
    }

    const data: ALUIEventData = eventData;

    lastUIEvent = {
      data,
      timedEmitter: new TimedTrigger(timerFired => {
        data.metadata.has_timed_out_before_bubble = '' + timerFired;
        channel.emit('al_ui_event', data);
        lastUIEvent = null;
      }, MAX_CAPTURE_TO_BUBBLE_DELAY_MS),
    };
  }

  /**
   * We know the the flowlet.data is going to carry the async flow data based
   * on where each function was created.
   * We want to make sure that flow knows what is the actual corresponding
   * alflowlet which corresponds to execution code at runtime.
   * Since as of now we only start a new flowlet when there is a UI event, we
   * add the following code to say whenever a new flowlet is pushed (a.k.a a new async
   * context is started), we ensure that knows which alflowlet is responsible for it.
   *
   * To ensure this info carries forward, we look at the uiEventFlowletManager stack.
   * This mechanism works because of how various 'creation time flowlets' are pushed/popped on
   * the stack.
   */
  flowletManager.onPush.add((flowlet, _reason) => {
    const uiEventFlowlet = uiEventFlowletManager.top();
    if (uiEventFlowletManager.stackSize() > 0 && flowlet.data.uiEventFlowlet !== uiEventFlowlet) {
      flowlet.data.uiEventFlowlet = uiEventFlowlet;
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
        flowlet.parent.data.uiEventFlowlet = uiEventFlowlet;
      }
    }
  });
}
