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
import { ALChannelSurfaceEvent, ALSurfaceEvent } from "./ALSurfaceTypes";
import { ALSurfaceData } from "./ALSurfaceData";
import { getFlags } from "hyperion-globals/src/Flags";
import { getVirtualPropertyValue, setVirtualPropertyValue } from "hyperion-core/src/intercept";

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

const VISIBILITY_OBSERVER_PROP = '_vis_observer';
const SURFACE_DATA_PROP = '_vis_surfacedata';


export function publish(options: InitOptions): void {
  const { channel } = options;
  // Default to false if not specified in flags
  const enableDynamicChildTracking = getFlags().enableDynamicChildTracking === true;
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

  // Helper functions for tracking and untracking elements
  function trackElement(observer: IntersectionObserver, element: Element, surfaceData: ALSurfaceData, observeElement: boolean = true): void {
    if (observeElement) {
      observer.observe(element);
    }
    if (enableDynamicChildTracking) {
      setVirtualPropertyValue<IntersectionObserver | null>(
        element,
        VISIBILITY_OBSERVER_PROP,
        observer,
      );
      setVirtualPropertyValue<ALSurfaceData | null>(
        element,
        SURFACE_DATA_PROP,
        surfaceData,
      );
    }
    observedRoots.set(element, surfaceData);
    surfaceDataRoots.set(surfaceData, element);
  }

  function untrackElement(observer: IntersectionObserver, element: Element, surfaceData: ALSurfaceData): void {
    observer.unobserve(element);
    if (enableDynamicChildTracking) {
      setVirtualPropertyValue<IntersectionObserver | null>(
        element,
        VISIBILITY_OBSERVER_PROP,
        null,
      );
      setVirtualPropertyValue<ALSurfaceData | null>(
        element,
        SURFACE_DATA_PROP,
        null,
      );
    }
    observedRoots.delete(element, surfaceData);
    surfaceDataRoots.delete(surfaceData, element);
  }

  let mutationObserver: MutationObserver | null = null;
  if (enableDynamicChildTracking) {
    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const element = mutation.target as Element;
          const observer = getVirtualPropertyValue<IntersectionObserver | null>(element, VISIBILITY_OBSERVER_PROP);
          const surfaceData = getVirtualPropertyValue<ALSurfaceData | null>(element, SURFACE_DATA_PROP);
          if (!observer || !surfaceData) {
            return;
          }
          // Handle removed nodes
          if (mutation.removedNodes.length > 0) {
            handleRemovedNodes(observer, element, surfaceData, mutation.removedNodes);
          }

          // Handle added nodes
          if (mutation.addedNodes.length > 0) {
            // Re-evaluate the entire element with its new children
            const surfaceDataList = observedRoots.get(element);
            if (surfaceDataList && surfaceDataList.includes(surfaceData)) {
              // Untrack the parent element first
              untrackElement(observer, element, surfaceData);
              // Try to find suitable children with the updated DOM
              const roots = getNonSurfaceWrapperRoots(element);
              if (roots.length > 0) {
                // Found suitable children, observe them
                for (let i = 0; i < roots.length; ++i) {
                  trackElement(observer, roots[i], surfaceData);
                  break; // Only need to observe one viable child
                }
              } else {
                // Still no suitable children, track the parent again
                // Which will check for observable roots again, and attach a mutation observer if needed
                trackElement(observer, element, surfaceData);
              }
            }
          }
        }
      }
    });
  }

  // Handle an element by either observing its suitable children or setting up a mutation observer
  function handleElementWithChildren(
    observer: IntersectionObserver,
    element: Element,
    surfaceData: ALSurfaceData,
  ): void {
    const roots = getNonSurfaceWrapperRoots(element);

    if (roots.length > 0) {
      // Normal case: we have viable children to observe
      for (let i = 0; i < roots.length; ++i) {
        trackElement(observer, roots[i], surfaceData);
      }
    } else if (enableDynamicChildTracking) {
      // Special case: no viable children to observe, so set up a mutation observer
      trackElement(observer, element, surfaceData, false);
      // Set up mutation observer to watch for child additions
      mutationObserver?.observe(element, { childList: true });
    }
  }

  function handleRemovedNodes(
    observer: IntersectionObserver,
    parentElement: Element,
    surfaceData: ALSurfaceData,
    removedNodes: NodeList
  ): void {
    let needToReobserveParent = false;

    for (let i = 0; i < removedNodes.length; i++) {
      const node = removedNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as Element;
        const surfaceDataList = observedRoots.get(childElement);

        // Check if this was a child we were observing
        if (surfaceDataList && surfaceDataList.includes(surfaceData)) {
          untrackElement(observer, childElement, surfaceData);
          needToReobserveParent = true;
        }
      }
    }

    // If we were observing a child that was removed, start observing the parent again
    if (needToReobserveParent) {
      handleElementWithChildren(observer, parentElement, surfaceData);
    }
  }

  function observe(surfaceData: ALSurfaceData, element: Element, trackVisibilityThreshold: number): void {
    const observer = getOrCreateObserver(trackVisibilityThreshold);
    handleElementWithChildren(observer, element, surfaceData);
  }

  function unobserve(surfaceData: ALSurfaceData, element: Element, trackVisibilityThreshold: number): void {
    const observer = getOrCreateObserver(trackVisibilityThreshold);
    const roots = getNonSurfaceWrapperRoots(element);

    if (roots.length > 0) {
      // Normal case: unobserve the child elements
      for (let i = 0; i < roots.length; ++i) {
        untrackElement(observer, roots[i], surfaceData);
      }
    } else if (enableDynamicChildTracking) {
      // Special case: we might be observing the root element itself
      untrackElement(observer, element, surfaceData);
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
