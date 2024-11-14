/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "hyperion-util/src/Types";
import performanceAbsoluteNow from "hyperion-util/src/performanceAbsoluteNow";
import { ALChannelSurfaceMutationEvent, ALSurfaceMutationEventData } from "./ALSurfaceMutationPublisher";
import * as ALSurfaceUtils from './ALSurfaceUtils';
import { ALElementEvent, ALExtensibleEvent, ALFlowletEvent, ALLoggableEvent, ALMetadataEvent, ALPageEvent, ALSharedInitOptions } from "./ALType";

import * as ALEventIndex from './ALEventIndex';
import { assert } from "hyperion-globals";
import { ALChannelSurfaceEvent } from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";

export type ALSurfaceVisibilityEventData =
  ALFlowletEvent &
  ALMetadataEvent &
  ALExtensibleEvent &
  ALElementEvent &
  ALPageEvent &
  ALLoggableEvent &
  Readonly<
    {
      surface: string;
      intersectionEntry: IntersectionObserverEntry;
    } &
    (
      {
        event: 'surface_visible';
        isIntersecting: true;
      }
      |
      {
        event: 'surface_hidden';
        isIntersecting: false;
      }
    )
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
  type SurfaceName = string;
  const activeSurfaces = new Map<SurfaceName, ALSurfaceMutationEventData>();
  const observedRoots = new Map<Element | null, SurfaceName>();

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
              observedRoots.set(el, event.surface);
            }
          } else {
            observer.observe(element);
            observedRoots.set(element, event.surface);
          }
          activeSurfaces.set(event.surface, event);

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
              observedRoots.delete(el);
            }
          } else {
            observer.unobserve(element);
            observedRoots.delete(element);
          }
          activeSurfaces.delete(event.surface);
        }
        break;
      }
    }

    // We need to also handle surface proxies
    channel.addListener('al_surface_mount', event => {
      if (!event.isProxy || !event.capability?.trackVisibilityThreshold || !event.element) {
        return;
      }
      const observer = getOrCreateObserver(event.capability.trackVisibilityThreshold);
      observer.observe(event.element);
      observedRoots.set(event.element, event.surface);
    });
    channel.addListener('al_surface_unmount', event => {
      if (!event.isProxy || !event.capability?.trackVisibilityThreshold) {
        return;
      }
      if (observedRoots.delete(event.element)) {
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
              const surface = observedRoots.get(element);
              if (!surface) {
                // could this happen when surface is unmounted first, and then becomes not visible?
                assert(false, `Unexpected situation! tracking visibility of unmounted surface`);
                continue;
              }
              const surfaceEvent = activeSurfaces.get(surface);
              const otherSurfaceInfo = ALSurfaceMutationPublisher.getSurfaceMountInfo(surface);
              assert(surfaceEvent === otherSurfaceInfo, "Unexpcted mismatch between the two surface event caches! ");

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

              const isIntersecting = entry.isIntersecting;
              channel.emit('al_surface_visibility_event', {
                ...isIntersecting
                  ? { event: 'surface_visible', isIntersecting }
                  : { event: 'surface_hidden', isIntersecting },
                eventTimestamp: performanceAbsoluteNow.fromRelativeTime(entry.time),
                eventIndex: ALEventIndex.getNextEventIndex(),
                relatedEventIndex: surfaceEvent.eventIndex,
                surface: surfaceEvent.surface,
                element: surfaceEvent.element,
                autoLoggingID: surfaceEvent.autoLoggingID, // same element, same ID
                metadata: {
                  emit_time: '' + performanceAbsoluteNow(), // just to keep track of the difference
                },
                callFlowlet: surfaceEvent.callFlowlet,
                triggerFlowlet: surfaceEvent.triggerFlowlet,
                intersectionEntry: entry,
                pageURI: surfaceEvent.pageURI,
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
