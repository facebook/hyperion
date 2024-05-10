/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "@hyperion/hyperion-util/src/Types";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import { ALChannelSurfaceMutationEvent, ALSurfaceMutationEventData } from "./ALSurfaceMutationPublisher";
import * as ALSurfaceUtils from './ALSurfaceUtils';
import { ALElementEvent, ALFlowletEvent, ALLoggableEvent, ALMetadataEvent, ALSharedInitOptions } from "./ALType";

import * as ALEventIndex from './ALEventIndex';
import { assert } from "@hyperion/hyperion-global";
import { ALChannelSurfaceEvent } from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";

export type ALSurfaceVisibilityEventData =
  ALFlowletEvent &
  ALMetadataEvent &
  ALElementEvent &
  ALLoggableEvent &
  Readonly<
    {
      surface: string;
      event: 'component_visibility';
      isIntersecting: boolean;
      intersectionEntry: IntersectionObserverEntry;
    }
  >;

export type ALChannelSurfaceVisibilityEvent = Readonly<{
  al_surface_visibility_event: [ALSurfaceVisibilityEventData],
}
>;

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelSurfaceVisibilityEvent & ALChannelSurfaceMutationEvent & ALChannelSurfaceEvent>
>;


export function publish(options: InitOptions): void {
  const { channel } = options;

  // lookup surfaces that are mounted by their root element 
  const activeSurfaces = new Map<Element | null, ALSurfaceMutationEventData>();

  // We need one observer per threshold
  const observers = new Map<number, IntersectionObserver>();

  channel.addListener('al_surface_mutation_event', event => {
    switch (event.event) {
      case 'mount_component': {
        if (event.capability?.trackVisibilityThreshold) {
          const observer = getOrCreateObserver(event.capability.trackVisibilityThreshold);
          const { element } = event;
          /**
           * IntersectionObserver cannot track display:content styles because
           * these elements don't have their own "box".
           * So, instead we have to focus on the children of the parent element
           */
          if (ALSurfaceUtils.isSurfaceWrapper(element)) {
            for (let el = element.firstElementChild; el; el = el.nextElementSibling) {
              observer.observe(el);
            }
          } else {
            observer.observe(element);
          }
          activeSurfaces.set(element, event);
        }

        break;
      }
      case 'unmount_component': {
        if (event.capability?.trackVisibilityThreshold) {
          const observer = getOrCreateObserver(event.capability.trackVisibilityThreshold);
          const { element } = event;
          if (ALSurfaceUtils.isSurfaceWrapper(element)) {
            for (let el = element.firstElementChild; el; el = el.nextElementSibling) {
              observer.unobserve(el);
            }
          } else {
            observer.unobserve(element);
          }
          activeSurfaces.delete(element);
        }
        break;
      }
    }

    // We need to also handle surface proxies
    channel.addListener('al_surface_mount', event => {
      if (!event.isProxy || !event.capability?.trackVisibilityThreshold || !event.element) {
        return;
      }
      const sufraceInfo = ALSurfaceMutationPublisher.getSurfaceMountInfo(event.surface);
      assert(!!sufraceInfo, "Invalid situation where a mounted surface does not have info");
      const activeSurfaceInfo = activeSurfaces.get(sufraceInfo.element);
      if (!activeSurfaceInfo) {
        return; // Can this ever happen?
      }
      const observer = getOrCreateObserver(event.capability.trackVisibilityThreshold);
      observer.observe(event.element);
      activeSurfaces.set(event.element, sufraceInfo);
    });
    channel.addListener('al_surface_unmount', event => {
      if (!event.isProxy || !event.capability?.trackVisibilityThreshold) {
        return;
      }
      if (activeSurfaces.delete(event.element)) {
        const observer = getOrCreateObserver(event.capability.trackVisibilityThreshold);
        observer.unobserve(event.element);
      }
    });

    function getOrCreateObserver(threshold: number): IntersectionObserver {
      let observer = observers.get(threshold);
      if (!observer) {
        observer = new IntersectionObserver(
          (entries: IntersectionObserverEntry[], _observer: IntersectionObserver) => {
            /**
             * Since surface may have many children that we added above, we need to merge
             * all the entries, however, in most cases we may have only one entry
             */
            const visibleSet = new Map<ALSurfaceMutationEventData, IntersectionObserverEntry[]>();
            for (const entry of entries) {
              const element = entry.target;
              const surfaceEvent = activeSurfaces.get(element) ?? activeSurfaces.get(element.parentElement); // element or its parent, see above for .observe(...)
              if (surfaceEvent) {
                let entries = visibleSet.get(surfaceEvent);
                if (!entries) {
                  entries = [];
                  visibleSet.set(surfaceEvent, entries);
                }
                entries.push(entry);
              }
            }
            for (const [surfaceEvent, entries] of visibleSet) {
              let entry = entries[0];
              __DEV__ && assert(entry != null, 'Unexpected situation');
              if (entries.length > 1) {
                // Need to merge the entries
                // ??
                console.warn("Don't know yet how to merge entries!");
              }

              channel.emit('al_surface_visibility_event', {
                event: 'component_visibility',
                eventTimestamp: performanceAbsoluteNow(),
                eventIndex: ALEventIndex.getNextEventIndex(),
                relatedEventIndex: surfaceEvent.eventIndex,
                surface: surfaceEvent.surface,
                element: surfaceEvent.element,
                autoLoggingID: surfaceEvent.autoLoggingID, // same element, same ID
                metadata: {},
                callFlowlet: surfaceEvent.callFlowlet,
                triggerFlowlet: surfaceEvent.triggerFlowlet,
                isIntersecting: entry.isIntersecting,
                intersectionEntry: entry,
              })
            }
          },
          { threshold }
        );
        observers.set(threshold, observer);
      }
      return observer;
    }
  });
}
