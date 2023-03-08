/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { ALChannelSurfaceEvent } from './ALSurface';
import type { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import { ALLoggableEvent, ALReactElementEvent } from "./ALType";

import { ALFlowlet, ALFlowletManager } from "./ALFlowletManager";
import * as ALID from './ALID';
import * as ALEventIndex from './ALEventIndex';
import performanceAbsoluteNow from '@hyperion/hyperion-util/src/performanceAbsoluteNow';
import { ComponentNameValidator, getReactComponentData_THIS_CAN_BREAK, ReactComponentData } from './ALReactUtils';
import { AUTO_LOGGING_SURFACE } from './ALSurfaceConsts';
import { getElementName } from './ALInteractableDOMElement';

type ALMutationEvent = ALReactElementEvent & Readonly<{
  event: 'mount_component' | 'unmount_component';
  element: HTMLElement,
  elementName: string | null,
  mountedDuration?: number;
  flowlet?: ALFlowlet | null;
}>;

export type AdsALSurfaceMutationEventData = Readonly<
  ALLoggableEvent &
  ALMutationEvent
>;

export type ALChannelSurfaceMutationEvent = Readonly<{
  al_surface_mutation_event: [AdsALSurfaceMutationEventData],
}
>;

export type ALSurfaceMutationChannel = Channel<ALChannelSurfaceMutationEvent & ALChannelSurfaceEvent>;

type SurfaceInfo = ALReactElementEvent & {
  surface: string,
  element: HTMLElement,
  addTime: number,
  removeTime?: number,
  addFlowlet: ALFlowlet | null,
  removeFlowlet?: ALFlowlet | null,
  elementName: string | null,
};

const activeSurfaces = new Map<string, SurfaceInfo>();

export type InitOptions = Types.Options<{
  channel: ALSurfaceMutationChannel;
  flowletManager: ALFlowletManager;
  cacheElementReactInfo: boolean;
  domSurfaceAttributeName?: string;
  componentNameValidator?: ComponentNameValidator;
}>;

export function publish(options: InitOptions): void {
  const { domSurfaceAttributeName = AUTO_LOGGING_SURFACE, channel, flowletManager, cacheElementReactInfo, componentNameValidator = null } = options;

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
          if (cacheElementReactInfo) {
            reactComponentData = getReactComponentData_THIS_CAN_BREAK(node, componentNameValidator);
            elementName = getElementName(node);
          }
          info = {
            surface,
            element: node,
            addTime: timestamp,
            addFlowlet: flowlet,
            reactComponentName: reactComponentData?.name,
            reactComponentStack: reactComponentData?.stack,
            elementName,
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
    const { surface, removeTime, element, elementName } = surfaceInfo;
    switch (action) {
      case 'added': {
        channel.emit('al_surface_mutation_event', {
          event: 'mount_component',
          eventTimestamp: surfaceInfo.addTime,
          eventIndex: ALEventIndex.getNextEventIndex(),
          element,
          elementName,
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          flowlet: surfaceInfo.addFlowlet,
          surface,
          reactComponentName: surfaceInfo.reactComponentName,
          reactComponentStack: surfaceInfo.reactComponentStack,
        });
        break;
      }
      case 'removed': {
        if (removeTime == null) {
          // Not expected to happen,  but to assert
          break;
        }
        channel.emit('al_surface_mutation_event', {
          event: 'unmount_component',
          eventTimestamp: removeTime,
          eventIndex: ALEventIndex.getNextEventIndex(),
          element,
          elementName,
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          mountedDuration: (removeTime - surfaceInfo.addTime) / 1000,
          flowlet: surfaceInfo.removeFlowlet,
          surface,
          reactComponentName: surfaceInfo.reactComponentName,
          reactComponentStack: surfaceInfo.reactComponentStack,
        });
        break;
      }
    }
  }
}
