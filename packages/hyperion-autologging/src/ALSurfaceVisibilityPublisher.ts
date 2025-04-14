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
import * as Flags from "hyperion-globals/src/Flags";

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
  // Default to false if not specified in flags
  const enableDynamicChildTracking = Flags.getFlags().enableDynamicChildTracking === true;
  // This keeps observers around,  and may be more expensive then a one time setup for delayed children rendering
  const enableDynamicChildTrackingForRemoval = Flags.getFlags().enableDynamicChildTrackingForRemoval === true;

  class MapToArray<Key, Value> {
    private map = new Map<Key, Value[]>();
    get(key: Key): undefined | Value[] {
      return this.map.get(key);
    }
    set(key: Key, value: Value) {
      let values = this.map.get(key);
      if (!values) {
        values = [];
        this.map.set(key, [value]);
      } else {
        values.push(value);
      }
    }
    delete(key: Key, value: Value) {
      let values = this.map.get(key);
      if (values) {
        const index = values.indexOf(value);
        if (index > -1) {
          values[index] = values[values.length - 1];
          values.length -= 1;
          if (values.length === 0) {
            this.map.delete(key);
          }
        }
      }
    }
    [Symbol.iterator]() {
      return this.map[Symbol.iterator]();
    }
  }

  // lookup surfaces that are mounted by their root element
  const observedRoots = new MapToArray<Element, ALSurfaceData>();
  const surfaceDataRoots = new MapToArray<ALSurfaceData, Element>();

  // We need one observer per threshold
  const observers = new Map<number, IntersectionObserver>();

  // Track mutation observers for empty surfaces
  const mutationObservers = new Map<Element, MutationObserver>();


  function getNonSurfaceWrapperRoots(element: Element): Element[] {
    if (ALSurfaceUtils.isSurfaceWrapper(element)) {
      const subRoots: Element[] = [];
      for (let el = element.firstElementChild; el; el = el.nextElementSibling) {
        if (!ALSurfaceUtils.isSurfaceWrapper(el)) {
          subRoots.push(el);
        }
      }
      if (subRoots.length > 0) {
        // we found at least one, good enough for us
        return subRoots;
      } else {
        // Could not find non-surface-wrapper root, so need to go deeper
        for (let el = element.firstElementChild; el; el = el.nextElementSibling) {
          const deepSubroot = getNonSurfaceWrapperRoots(el);
          if (deepSubroot.length > 0) {
            return deepSubroot;
          }
        }
        return [];
      }
    } else {
      return [element];
    }
  }

  function observe(surfaceData: ALSurfaceData, element: Element, trackVisibilityThreshold: number): void {
    const observer = getOrCreateObserver(trackVisibilityThreshold);
    /**
     * IntersectionObserver cannot track display:content styles because
     * these elements don't have their own "box".
     * So, instead we have to focus on the children of the parent element
     */
    const roots = getNonSurfaceWrapperRoots(element);

    if (roots.length > 0) {
      // Normal case: we have viable children to observe
      for (let i = 0; i < roots.length; ++i) {
        const root = roots[i];
        observer.observe(root);
        observedRoots.set(root, surfaceData);
        surfaceDataRoots.set(surfaceData, root);
      }
    } else if (enableDynamicChildTracking) {
      // Special case: no viable children to observe, so observe the root element itself
      // and set up a mutation observer to watch for child additions
      observer.observe(element);
      observedRoots.set(element, surfaceData);
      surfaceDataRoots.set(surfaceData, element);

      // Set up mutation observer to watch for child additions
      const mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            if (enableDynamicChildTrackingForRemoval) {
              // Handle removed nodes first
              if (mutation.removedNodes.length > 0) {
                for (let i = 0; i < mutation.removedNodes.length; i++) {
                  const node = mutation.removedNodes[i];
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const childElement = node as Element;
                    const surfaceDataList = observedRoots.get(childElement);

                    // Check if this was a child we were observing
                    if (surfaceDataList && surfaceDataList.includes(surfaceData)) {
                      console.log('Child removed', childElement);

                      // Stop observing the removed child
                      observer.unobserve(childElement);
                      observedRoots.delete(childElement, surfaceData);
                      surfaceDataRoots.delete(surfaceData, childElement);

                      // Start observing the parent element again
                      observer.observe(element);
                      observedRoots.set(element, surfaceData);
                      surfaceDataRoots.set(surfaceData, element);
                    }
                  }
                }
              }
            }

            // Then handle added nodes
            let hasViableChild = false;
            if (mutation.addedNodes.length > 0) {
              // Check if any of the added nodes are elements we can observe
              for (let i = 0; i < mutation.addedNodes.length; i++) {
                const node = mutation.addedNodes[i];
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const childElement = node as Element;
                  console.log('Child found', childElement);

                  if (!ALSurfaceUtils.isSurfaceWrapper(childElement)) {
                    // Check if we're currently observing the parent element
                    const surfaceDataList = observedRoots.get(element);
                    if (surfaceDataList && surfaceDataList.includes(surfaceData)) {
                      // Found a viable child, switch observation to it
                      observer.unobserve(element);
                      observer.observe(childElement);

                      // Update tracking maps
                      observedRoots.delete(element, surfaceData);
                      observedRoots.set(childElement, surfaceData);
                      surfaceDataRoots.delete(surfaceData, element);
                      surfaceDataRoots.set(surfaceData, childElement);
                      hasViableChild = true;
                      break;
                    }
                  }
                }
              }
            }
            // If we are tracking removal,  we need to keep the observer around,  which could be potentially expensive
            if (hasViableChild && !enableDynamicChildTrackingForRemoval) {
              // Disconnect the mutation observer as we no longer need it
              mutationObserver.disconnect();
              mutationObservers.delete(element);
            }
          }
        }
      });

      // Start observing for child additions
      mutationObserver.observe(element, { childList: true });
      mutationObservers.set(element, mutationObserver);
    }
  }
  function unobserve(surfaceData: ALSurfaceData, element: Element, trackVisibilityThreshold: number): void {
    const observer = getOrCreateObserver(trackVisibilityThreshold);
    const roots = getNonSurfaceWrapperRoots(element);

    if (roots.length > 0) {
      // Normal case: unobserve the child elements
      for (let i = 0; i < roots.length; ++i) {
        const root = roots[i];
        observer.unobserve(root);
        observedRoots.delete(root, surfaceData);
        surfaceDataRoots.delete(surfaceData, root);
      }
    } else if (enableDynamicChildTracking) {
      // Special case: we might be observing the root element itself
      observer.unobserve(element);
      observedRoots.delete(element, surfaceData);
      surfaceDataRoots.delete(surfaceData, element);

      // Clean up any mutation observer
      const mutationObserver = mutationObservers.get(element);
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObservers.delete(element);
      }
    }
  }

  channel.addListener('al_surface_mutation_event', event => {
    __DEV__ && assert(event.surfaceData.getMutationEvent() === event, 'Invalid situation for surface mutation event');
    if (event.capability?.trackVisibilityThreshold) {
      switch (event.event) {
        case 'mount_component': {
          observe(event.surfaceData, event.element, event.capability.trackVisibilityThreshold);
          break;
        }
        case 'unmount_component': {
          unobserve(event.surfaceData, event.element, event.capability.trackVisibilityThreshold);
          break;
        }
      }
    }
  });

  // We need to also handle surface proxies
  channel.addListener('al_surface_mount', event => {
    if (!event.isProxy || !event.capability?.trackVisibilityThreshold || !event.element) {
      return;
    }
    observe(event.surfaceData, event.element, event.capability.trackVisibilityThreshold);
  });
  channel.addListener('al_surface_unmount', event => {
    if (!event.isProxy || !event.capability?.trackVisibilityThreshold) {
      return;
    }
    unobserve(event.surfaceData, event.element, event.capability.trackVisibilityThreshold);
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
          const visibleSet = new MapToArray<ALSurfaceData, IntersectionObserverEntry>();
          for (const entry of entries) {
            const element = entry.target;
            const surfaceDataList = observedRoots.get(element);
            if (!surfaceDataList) {
              // could this happen when surface is unmounted first, and then becomes not visible?
              assert(false, `Unexpected situation! tracking visibility of unmounted surface`);
              continue;
            }

            for (let i = 0; i < surfaceDataList.length; ++i) {
              const surfaceData = surfaceDataList[i];
              if (surfaceData.getMutationEvent()) {
                visibleSet.set(surfaceData, entry);
              } else {
                /**
                 * Not clear why this situation is happening sometimes. It might be because of proxy surfaces, or the fact
                 * that mutation events fire synchronously with react changes, while visibility events fire async.
                 * We might want to track mutation event directly in this module.
                 */
                console.warn(`Surface ${surfaceData.nonInteractiveSurface} has visibility event but is already unmounted!`)
              }
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
                ...surfaceData.metadata,
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
