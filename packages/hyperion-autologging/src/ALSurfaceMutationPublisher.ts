/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import type { ALChannelSurfaceEvent } from './ALSurface';
import { ALLoggableEvent, ALOptionalFlowletEvent, ALReactElementEvent, ALSharedInitOptions } from "./ALType";

import performanceAbsoluteNow from '@hyperion/hyperion-util/src/performanceAbsoluteNow';
import ALElementInfo from './ALElementInfo';
import * as ALEventIndex from './ALEventIndex';
import { ALFlowlet } from "./ALFlowletManager";
import * as ALID from './ALID';
import { ALElementNameResult, getElementName } from './ALInteractableDOMElement';
import { ReactComponentData } from './ALReactUtils';
import { assert } from "@hyperion/global/src/assert";

type ALMutationEvent = ALReactElementEvent & ALOptionalFlowletEvent & Readonly<
  {
    surface: string;
    element: HTMLElement;
    elementName: string | null;
    elementNameSource: ALElementNameResult['source'] | null;
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

type SurfaceInfo = ALReactElementEvent & {
  surface: string,
  element: HTMLElement,
  addTime: number,
  removeTime?: number,
  addFlowlet: ALFlowlet | null,
  removeFlowlet: ALFlowlet | null,
  elementName: string | null,
  elementNameSource: ALElementNameResult['source'] | null,
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

  function processNode(node: Node, action: 'added' | 'removed') {
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
          let elementName: string | null = null;
          let elementNameSource: ALElementNameResult['source'] | null = null;
          if (cacheElementReactInfo) {
            const elementInfo = ALElementInfo.getOrCreate(node);
            reactComponentData = elementInfo.getReactComponentData();
            const elementNameResult = getElementName(node);
            if(elementNameResult) {
              elementName = elementNameResult.text;
              elementNameSource = elementNameResult.source;
            }
          }
          info = {
            surface,
            element: node,
            addTime: timestamp,
            addFlowlet: flowlet,
            reactComponentName: reactComponentData?.name,
            reactComponentStack: reactComponentData?.stack,
            elementName,
            elementNameSource,
            removeFlowlet: null,
            mountEvent: null,
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
      processNode(element, 'added');
    }
  });

  channel.addListener('al_surface_unmount', event => {
    const removeSurfaceNode = activeSurfaces.get(event.surface);
    if (removeSurfaceNode) {
      processNode(removeSurfaceNode.element, 'removed');
    }
  });


  function emitMutationEvent(
    action: 'added' | 'removed',
    surfaceInfo: SurfaceInfo
  ): void {
    const { surface, removeTime, element, elementName, elementNameSource, mountEvent } = surfaceInfo;
    switch (action) {
      case 'added': {
        const flowlet = surfaceInfo.addFlowlet;
        channel.emit('al_surface_mutation_event', surfaceInfo.mountEvent = {
          event: 'mount_component',
          eventTimestamp: surfaceInfo.addTime,
          eventIndex: ALEventIndex.getNextEventIndex(),
          element,
          elementName,
          elementNameSource,
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          flowlet,
          alFlowlet: flowlet?.data.alFlowlet,
          surface,
          reactComponentName: surfaceInfo.reactComponentName,
          reactComponentStack: surfaceInfo.reactComponentStack,
        });
        break;
      }
      case 'removed': {
        assert(mountEvent != null && removeTime != null, "Missing mutaion info for unmounting");
        const flowlet = surfaceInfo.removeFlowlet;
        channel.emit('al_surface_mutation_event', {
          event: 'unmount_component',
          eventTimestamp: removeTime,
          eventIndex: ALEventIndex.getNextEventIndex(),
          element,
          elementName,
          elementNameSource,
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          mountedDuration: (removeTime - surfaceInfo.addTime) / 1000,
          flowlet,
          alFlowlet: flowlet?.data.alFlowlet,
          surface,
          reactComponentName: surfaceInfo.reactComponentName,
          reactComponentStack: surfaceInfo.reactComponentStack,
          mountEvent,
        });
        break;
      }
    }
  }
}
