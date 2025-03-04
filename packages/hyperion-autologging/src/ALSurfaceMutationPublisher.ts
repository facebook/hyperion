/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "hyperion-util/src/Types";
import performanceAbsoluteNow from 'hyperion-util/src/performanceAbsoluteNow';
import * as ALCustomEvent from "./ALCustomEvent";
import ALElementInfo from './ALElementInfo';
import * as ALEventIndex from './ALEventIndex';
import * as ALID from './ALID';
import { ALElementTextEvent, getElementTextEvent } from './ALInteractableDOMElement';
import { ReactComponentData } from './ALReactUtils';
import type { ALChannelSurfaceEvent, ALSurfaceCapability, ALSurfaceEventData } from './ALSurface';
import { ALSurfaceEvent } from "./ALSurfaceData";
import { ALElementEvent, ALFlowletEvent, ALLoggableEvent, ALMetadataEvent, ALPageEvent, ALReactElementEvent, ALSharedInitOptions } from "./ALType";
import { getCurrMainPageUrl } from "./MainPageUrl";
import { assert } from "hyperion-globals";

export type ALSurfaceMutationEventData =
  ALLoggableEvent &
  ALPageEvent &
  ALReactElementEvent &
  ALElementTextEvent &
  ALFlowletEvent &
  ALMetadataEvent &
  ALElementEvent &
  ALSurfaceEvent &
  Readonly<
    {
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

export type ALChannelSurfaceMutationEvent = Readonly<{
  al_surface_mutation_event: [ALSurfaceMutationEventData],
}
>;

export type InitOptions = Types.Options<
  ALSharedInitOptions<ALChannelSurfaceMutationEvent & ALChannelSurfaceEvent & ALCustomEvent.ALChannelCustomEvent> &
  {
    cacheElementReactInfo: boolean;
    /**
     * Whether to include elementName, and elementText extraction and fields in the published events.
     * Element text extraction can be expensive depending on the event,  and for mutations may not be relevant.
     */
    enableElementTextExtraction?: boolean;
  }
>;

export function publish(options: InitOptions): void {
  const { channel, flowletManager, cacheElementReactInfo, enableElementTextExtraction = false } = options;

  function processNode(event: ALSurfaceEventData, action: 'added' | 'removed') {
    const timestamp = performanceAbsoluteNow();
    const { element, surface, metadata, surfaceData } = event;

    const callFlowlet = flowletManager.top();
    if (!(element instanceof HTMLElement) || /LINK|SCRIPT/.test(element.nodeName)) {
      return;
    }
    if (surface == null) {
      return;
    }
    let mutationEvent = surfaceData.getMutationEvent();

    __DEV__ && assert(
      !mutationEvent || mutationEvent.element === element || mutationEvent.surface === surface,
      `Invalid situation! Wrong Mutation Event is associated to surface ${surface}`
    );

    switch (action) {
      case 'added': {
        if (!mutationEvent) {
          let reactComponentData: ReactComponentData | null = null;
          if (cacheElementReactInfo) {
            const elementInfo = ALElementInfo.getOrCreate(element);
            reactComponentData = elementInfo.getReactComponentData();
          }
          const elementText = enableElementTextExtraction ? getElementTextEvent(element, surface) : getElementTextEvent(null, null);

          if (callFlowlet) {
            metadata.add_call_flowlet = callFlowlet?.getFullName();
          }
          // surfaceData.setInheritedPropery('surface_mutation_add_time', timestamp);
          channel.emit('al_surface_mutation_event', mutationEvent = surfaceData.setMutationEvent({
            ...event,
            event: 'mount_component',
            eventTimestamp: timestamp,
            eventIndex: ALEventIndex.getNextEventIndex(),
            surface, // already in the evet, need to add again?
            surfaceData, // already in the event. 
            element, // already in the evet, need to add again?
            autoLoggingID: ALID.getOrSetAutoLoggingID(element),
            reactComponentName: reactComponentData?.name,
            reactComponentStack: reactComponentData?.stack,
            ...elementText,
            metadata, // already in the evet, need to add again?
            pageURI: getCurrMainPageUrl(),
          }));
        } else if (element === mutationEvent.element) {
          console.warn(`Multiple mutation events for the same surface ${surface} `);
          // } else if (element.contains(mutationEvent.element)) {
          /**
          * This means we are seeing a element that is higher in the DOM
          * and belongs to a surface that we have seen before.
          * So, we can just update the surface=>element info.
          *  */
          // info.element = element;
          // info.autoLoggingID = ALID.getOrSetAutoLoggingID(element);
          // surfaceData.setExtension('surface_mutation', { addTime: timestamp });
          // info.addTime = timestamp;
          // if (callFlowlet) {
          //   info.metadata.add_call_flowlet = callFlowlet.getFullName();
          // }
        } else {
          if (!surfaceData.getInheritedPropery<boolean>('hasDuplicates')) {
            // Report it once
            console.error(`Same surface '${surface} name used for different surface instances at `, element, mutationEvent.element);
            surfaceData.setInheritedPropery('hasDuplicates', true);
          }
        }
        break;
      }
      case 'removed': {
        if (mutationEvent && mutationEvent.element === element && mutationEvent.event === 'mount_component') { // should we do assert instead?
          const removeTime = timestamp;
          /**
           * We share the same object between the mount and unmount events
           * therefore, any change by the subscribers of these events will
           * be seen on the object itself.
           * If we really wanted to be sure we can run the following code
           * but the perf overhead would be un-necessary.
           * // Object.assign(info.metadata, metadata);
           */
          if (callFlowlet) {
            mutationEvent.metadata.remove_call_flowlet = callFlowlet.getFullName();
          }
          // Update the surfaceData before emitting event in case event handlers wanted to use this data; then we can delete
          channel.emit('al_surface_mutation_event', surfaceData.setMutationEvent({
            ...mutationEvent,
            event: 'unmount_component',
            eventTimestamp: removeTime,
            eventIndex: ALEventIndex.getNextEventIndex(),
            relatedEventIndex: mutationEvent.eventIndex,
            mountedDuration: (removeTime - mutationEvent.eventTimestamp) / 1000,
            mountEvent: mutationEvent,
            // flowlet: event.flowlet, // We want to keep the info.flowlet here
            triggerFlowlet: event.triggerFlowlet, // the trigger has changed from what was saved in info
          }));
          // Now that we are done with this surface, we can try removing it
          surfaceData.setMutationEvent(null);
        } else {
          if (!surfaceData.getInheritedPropery<boolean>('hasDuplicates')) {
            console.error(`Surface ${surface} is unmounted without proper previous mount event`);
          }
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
