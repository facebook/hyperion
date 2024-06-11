/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "@hyperion/hyperion-util/src/Types";
import performanceAbsoluteNow from '@hyperion/hyperion-util/src/performanceAbsoluteNow';
import * as ALCustomEvent from "./ALCustomEvent";
import ALElementInfo from './ALElementInfo';
import * as ALEventIndex from './ALEventIndex';
import * as ALID from './ALID';
import { ALElementTextEvent, getElementTextEvent } from './ALInteractableDOMElement';
import { ReactComponentData } from './ALReactUtils';
import type { ALChannelSurfaceEvent, ALSurfaceEventData, ALSurfaceCapability } from './ALSurface';
import { ALElementEvent, ALFlowletEvent, ALLoggableEvent, ALMetadataEvent, ALPageEvent, ALReactElementEvent, ALSharedInitOptions } from "./ALType";

type ALMutationEvent =
  ALReactElementEvent &
  ALElementTextEvent &
  ALFlowletEvent &
  ALMetadataEvent &
  ALElementEvent &
  Readonly<
    {
      surface: string;
      capability: ALSurfaceCapability | null | undefined
    }
    &
    (
      {
        event: 'mount_component';
      }
      |
      {
        event: 'unmount_component';
        mountedDuration: number;
        mountEvent: ALSurfaceMutationEventData;
      }
    )
  >;

export type ALSurfaceMutationEventData = Readonly<
  ALLoggableEvent &
  ALPageEvent &
  ALMutationEvent
>;

export type ALChannelSurfaceMutationEvent = Readonly<{
  al_surface_mutation_event: [ALSurfaceMutationEventData],
}
>;

type SurfaceInfo = ALSurfaceMutationEventData & Types.Writeable<ALElementEvent> & {
  addTime: number,
};

const activeSurfaces = new Map<string, SurfaceInfo>();

export function getSurfaceMountInfo(surface: string): ALSurfaceMutationEventData | undefined {
  return activeSurfaces.get(surface);
}

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelSurfaceMutationEvent & ALChannelSurfaceEvent & ALCustomEvent.ALChannelCustomEvent> &
  {
    cacheElementReactInfo: boolean;
  }
>;

export function publish(options: InitOptions): void {
  const { channel, flowletManager, cacheElementReactInfo } = options;

  function processNode(event: ALSurfaceEventData, action: 'added' | 'removed') {
    const timestamp = performanceAbsoluteNow();
    const { element, surface, metadata } = event;

    const callFlowlet = flowletManager.top();
    if (!(element instanceof HTMLElement) || /LINK|SCRIPT/.test(element.nodeName)) {
      return;
    }
    if (surface == null) {
      return;
    }
    switch (action) {
      case 'added': {
        let info = activeSurfaces.get(surface);
        if (!info) {
          let reactComponentData: ReactComponentData | null = null;
          let elementText: ALElementTextEvent;
          if (cacheElementReactInfo) {
            const elementInfo = ALElementInfo.getOrCreate(element);
            reactComponentData = elementInfo.getReactComponentData();
            elementText = getElementTextEvent(element, surface);
          } else {
            elementText = getElementTextEvent(null, surface);
          }
          if (callFlowlet) {
            metadata.add_call_flowlet = callFlowlet?.getFullName();
          }
          info = {
            ...event,
            event: 'mount_component',
            eventTimestamp: timestamp,
            eventIndex: ALEventIndex.getNextEventIndex(),
            surface, // already in the evet, need to add again?
            element, // already in the evet, need to add again?
            autoLoggingID: ALID.getOrSetAutoLoggingID(element),
            reactComponentName: reactComponentData?.name,
            reactComponentStack: reactComponentData?.stack,
            ...elementText,
            metadata, // already in the evet, need to add again?
            addTime: timestamp,
            pageURI: window.location.href,
          };
          activeSurfaces.set(surface, info);

          channel.emit('al_surface_mutation_event', info);

        } else if (element != info.element && element.contains(info.element)) {
          /**
          * This means we are seeing a element that is higher in the DOM
          * and belongs to a surface that we have seen before.
          * So, we can just update the surface=>element info.
          *  */
          info.element = element;
          info.autoLoggingID = ALID.getOrSetAutoLoggingID(element);
          info.addTime = timestamp;
          if (callFlowlet) {
            info.metadata.add_call_flowlet = callFlowlet.getFullName();
          }
        }
        break;
      }
      case 'removed': {
        const info = activeSurfaces.get(surface);
        if (info && info.element === element) {
          const removeTime = timestamp;
          activeSurfaces.delete(surface);
          /**
           * We share the same object between the mount and unmount events
           * therefore, any change by the subscribers of these events will
           * be seen on the object itself.
           * If we really wanted to be sure we can run the following code
           * but the perf overhead would be un-necessary.
           * // Object.assign(info.metadata, metadata);
           */
          if (callFlowlet) {
            info.metadata.remove_call_flowlet = callFlowlet.getFullName();
          }
          channel.emit('al_surface_mutation_event', {
            ...info,
            event: 'unmount_component',
            eventTimestamp: removeTime,
            eventIndex: ALEventIndex.getNextEventIndex(),
            relatedEventIndex: info.eventIndex,
            mountedDuration: (removeTime - info.addTime) / 1000,
            mountEvent: info,
            // flowlet: event.flowlet, // We want to keep the info.flowlet here
            triggerFlowlet: event.triggerFlowlet, // the trigger has changed from what was saved in info
          });
        }
        break;
      }
    }
  }

  channel.addListener('al_surface_mount', event => {
    !event.isProxy && processNode(event, 'added');
  });

  channel.addListener('al_surface_unmount', event => {
    !event.isProxy && processNode(event, 'removed');
  });
}
