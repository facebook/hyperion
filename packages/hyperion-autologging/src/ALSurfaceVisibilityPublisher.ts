/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "hyperion-util/src/Types";
import performanceAbsoluteNow from "hyperion-util/src/performanceAbsoluteNow";
import { ALChannelSurfaceMutationEvent } from "./ALSurfaceMutationPublisher";
import * as ALSurfaceUtils from './ALSurfaceUtils';
import type { ALElementEvent, ALExtensibleEvent, ALFlowletEvent, ALLoggableEvent, ALMetadataEvent, ALPageEvent, ALSharedInitOptions } from "./ALType";

import { assert } from "hyperion-globals";
import * as ALEventIndex from './ALEventIndex';
import { ALChannelSurfaceEvent } from "./ALSurface";
import { ALSurfaceData, ALSurfaceEvent } from "./ALSurfaceData";

export type ALSurfaceVisibilityEventData =
  ALElementEvent &
  ALExtensibleEvent &
  ALFlowletEvent &
  ALLoggableEvent &
  ALMetadataEvent &
  ALPageEvent &
  ALSurfaceEvent &
  Readonly<
    {
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
  const observedRoots = new Map<Element, ALSurfaceData>();

  // We need one observer per threshold
  const observers = new Map<number, IntersectionObserver>();

  channel.addListener('al_surface_mutation_event', event => {
    __DEV__ && assert(event.surfaceData.getMutationEvent() === event, 'Invalid situation for surface mutation event');
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
              observedRoots.set(el, event.surfaceData);
            }
          } else {
            observer.observe(element);
            observedRoots.set(element, event.surfaceData);
          }
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
        }
        break;
      }
    }
  });

  // We need to also handle surface proxies
  channel.addListener('al_surface_mount', event => {
    if (!event.isProxy || !event.capability?.trackVisibilityThreshold || !event.element) {
      return;
    }
    const observer = getOrCreateObserver(event.capability.trackVisibilityThreshold);
    observer.observe(event.element);
    observedRoots.set(event.element, event.surfaceData);
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
          const visibleSet = new Map<ALSurfaceData, IntersectionObserverEntry[]>();
          for (const entry of entries) {
            const element = entry.target;
            const surfaceData = observedRoots.get(element);
            if (!surfaceData) {
              // could this happen when surface is unmounted first, and then becomes not visible?
              assert(false, `Unexpected situation! tracking visibility of unmounted surface`);
              continue;
            }

            if (surfaceData.getMutationEvent()) {
              let entries = visibleSet.get(surfaceData);
              if (!entries) {
                entries = [];
                visibleSet.set(surfaceData, entries);
              }
              entries.push(entry);
            } else {
              /**
               * Not clear why this situation is happening sometimes. It might be because of proxy surfaces, or the fact
               * that mutation events fire synchronously with react changes, while visibility events fire async.
               * We might want to track mutation event directly in this module.
               */
              console.warn(`Surface ${surfaceData.nonInteractiveSurface} has visibility event but is already unmounted!`)
            }
          }
          for (const [surfaceData, entries] of visibleSet) {
            let entry = entries[0];
            __DEV__ && assert(entry != null, 'Unexpected situation');
            if (entries.length > 1) {
              // Need to merge the entries
              // ??
              console.warn("Don't know yet how to merge entries!");
            }

            const mutationEvent = surfaceData.getMutationEvent();
            assert(mutationEvent != null, "Invalid situation! Surface visibility change without mutation event first");
            const isIntersecting = entry.isIntersecting;

            // update surfaceData before emitting the event.
            channel.emit('al_surface_visibility_event', surfaceData.setVisibilityEvent({
              ...isIntersecting
                ? { event: 'surface_visible', isIntersecting }
                : { event: 'surface_hidden', isIntersecting },
              eventTimestamp: performanceAbsoluteNow.fromRelativeTime(entry.time),
              eventIndex: ALEventIndex.getNextEventIndex(),
              relatedEventIndex: mutationEvent.eventIndex,
              surface: surfaceData.nonInteractiveSurface,
              surfaceData,
              element: mutationEvent.element,
              autoLoggingID: mutationEvent.autoLoggingID, // same element, same ID
              metadata: {
                emit_time: '' + performanceAbsoluteNow(), // just to keep track of the difference
              },
              callFlowlet: mutationEvent.callFlowlet,
              triggerFlowlet: mutationEvent.triggerFlowlet,
              intersectionEntry: entry,
              pageURI: mutationEvent.pageURI,
            }));
            if (!isIntersecting) {
              // hiding
              surfaceData.setVisibilityEvent(null);
            }
          }
        },
        { threshold }
      );
      observers.set(threshold, observer);
    }
    return observer;
  }
}
