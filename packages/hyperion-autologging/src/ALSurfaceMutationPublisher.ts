/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import type { ALChannelSurfaceEvent } from './ALSurface';
import { ALLoggableEvent, ALMetadataEvent, ALOptionalFlowletEvent, ALReactElementEvent, ALSharedInitOptions } from "./ALType";

import { assert } from "@hyperion/global/src/assert";
import performanceAbsoluteNow from '@hyperion/hyperion-util/src/performanceAbsoluteNow';
import ALElementInfo from './ALElementInfo';
import * as ALEventIndex from './ALEventIndex';
import { ALFlowlet } from "./ALFlowletManager";
import * as ALID from './ALID';
import { ALElementTextEvent, getElementTextEvent } from './ALInteractableDOMElement';
import { ReactComponentData } from './ALReactUtils';

type ALMutationEvent = ALReactElementEvent & ALElementTextEvent & ALOptionalFlowletEvent & Readonly<
  {
    surface: string;
    element: HTMLElement;
    autoLoggingID: ALID.ALID;
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
  ALMutationEvent
>;

export type ALChannelSurfaceMutationEvent = Readonly<{
  al_surface_mutation_event: [ALSurfaceMutationEventData],
}
>;

export type ALSurfaceMutationChannel = Channel<ALChannelSurfaceMutationEvent & ALChannelSurfaceEvent>;

type SurfaceInfo = ALReactElementEvent & ALElementTextEvent & ALMetadataEvent & {
  surface: string,
  element: HTMLElement,
  addTime: number,
  removeTime?: number,
  addFlowlet: ALFlowlet | null,
  removeFlowlet: ALFlowlet | null,
  mountEvent: ALSurfaceMutationEventData | null,
};

const activeSurfaces = new Map<string, SurfaceInfo>();

export type InitOptions = Types.Options<
  ALSharedInitOptions & {
    channel: ALSurfaceMutationChannel;
    cacheElementReactInfo: boolean;
  }
>;

export function publish(options: InitOptions): void {
  const { domSurfaceAttributeName, channel, flowletManager, cacheElementReactInfo } = options;

  function processNode(node: Node, action: 'added' | 'removed', metadata: ALMetadataEvent['metadata']) {
    const timestamp = performanceAbsoluteNow();

    const flowlet = flowletManager.top();
    if (!(node instanceof HTMLElement) || /LINK|SCRIPT/.test(node.nodeName)) {
      return;
    }
    const surface = node.getAttribute(domSurfaceAttributeName);
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
            const elementInfo = ALElementInfo.getOrCreate(node);
            reactComponentData = elementInfo.getReactComponentData();
            elementText = getElementTextEvent(node, surface);
          } else {
            elementText = getElementTextEvent(null, surface);
          }
          info = {
            surface,
            element: node,
            addTime: timestamp,
            addFlowlet: flowlet,
            reactComponentName: reactComponentData?.name,
            reactComponentStack: reactComponentData?.stack,
            ...elementText,
            removeFlowlet: null,
            mountEvent: null,
            metadata,
          };
          activeSurfaces.set(surface, info);
          emitMutationEvent(action, info);
        } else if (node != info.element && node.contains(info.element)) {
          /**
          * This means we are seeing a node that is higher in the DOM
          * and belongs to a surface that we have seen before.
          * So, we can just update the surface=>node info.
          *  */
          info.element = node;
          info.addFlowlet = flowlet;
          info.addTime = timestamp;
        }
        break;
      }
      case 'removed': {
        const info = activeSurfaces.get(surface);
        if (info && info.element === node) {
          info.removeFlowlet = flowlet;
          info.removeTime = timestamp;
          activeSurfaces.delete(surface);
          /**
           * We share the same object between the mount and unmount events
           * therefore, any change by the subscribers of these events will
           * be seen on the object itself.
           * If we really wanted to be sure we can run the following code
           * but the perf overhead would be un-necessary.
           * // Object.assign(info.metadata, metadata); 
           */
          emitMutationEvent(action, info);
        }
        break;
      }
    }
  }

  channel.addListener('al_surface_mount', event => {
    const element = document.querySelector(
      `[${domSurfaceAttributeName}='${event.surface}']`,
    );
    if (element != null) {
      processNode(element, 'added', event.metadata);
    }
  });

  channel.addListener('al_surface_unmount', event => {
    const removeSurfaceNode = activeSurfaces.get(event.surface);
    if (removeSurfaceNode) {
      processNode(removeSurfaceNode.element, 'removed', event.metadata);
    }
  });


  function emitMutationEvent(
    action: 'added' | 'removed',
    surfaceInfo: SurfaceInfo
  ): void {
    const { removeTime, element, mountEvent } = surfaceInfo;
    switch (action) {
      case 'added': {
        const flowlet = surfaceInfo.addFlowlet;
        channel.emit('al_surface_mutation_event', surfaceInfo.mountEvent = {
          ...surfaceInfo,
          event: 'mount_component',
          eventTimestamp: surfaceInfo.addTime,
          eventIndex: ALEventIndex.getNextEventIndex(),
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          flowlet,
          alFlowlet: flowlet?.data.alFlowlet,
        });
        break;
      }
      case 'removed': {
        assert(mountEvent != null && removeTime != null, "Missing mutaion info for unmounting");
        const flowlet = surfaceInfo.removeFlowlet;
        channel.emit('al_surface_mutation_event', {
          ...surfaceInfo,
          event: 'unmount_component',
          eventTimestamp: removeTime,
          eventIndex: ALEventIndex.getNextEventIndex(),
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          mountedDuration: (removeTime - surfaceInfo.addTime) / 1000,
          flowlet,
          alFlowlet: flowlet?.data.alFlowlet,
          mountEvent,
        });
        break;
      }
    }
  }
}
