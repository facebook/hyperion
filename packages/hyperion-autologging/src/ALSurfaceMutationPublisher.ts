/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { ALChannelSurfaceEvent } from './ALSurface';
import type { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import { ALLoggableEvent } from "./ALType";

import { ALFlowlet, ALFlowletManager } from "./ALFlowletManager";
import * as ALID from './ALID';
import * as ALEventIndex from './ALEventIndex';
// import {getAutoLoggingQPLEvent, onInteraction} from 'AdsALProfiler';
// import AdsALUIState from 'AdsALUIState';
import performanceAbsoluteNow from '@hyperion/hyperion-util/src/performanceAbsoluteNow';



type SurfaceInfo = {
  surface: string,
  element: HTMLElement,
  addTime: number,
  removeTime?: number,
  addFlowlet: ALFlowlet | null,
  removeFlowlet?: ALFlowlet | null,
};


const activeSurfaces = new Map<string, SurfaceInfo>();

export type AdsALSurfaceMutationEventData = Readonly<
  ALLoggableEvent &
  {
    event: 'mount_component' | 'unmount_component';
    element: HTMLElement,
    mountedDuration?: number;
    mutationImpl: 'surface';
    flowlet?: ALFlowlet | null;
  }
>;

export type ALChannelSurfaceMutationEvent = Readonly<{
  al_mutation_event: [AdsALSurfaceMutationEventData],
}
>;

export type ALSurfaceMutationChannel = Channel<ALChannelSurfaceMutationEvent & ALChannelSurfaceEvent>;

export type InitOptions = Types.Options<{
  channel: ALSurfaceMutationChannel;
  flowletManager: ALFlowletManager;
  cacheElementInfo: boolean;
  domSurfaceAttributeName: string;
}>;


export function publish(options: InitOptions): void {
  const { domSurfaceAttributeName, channel, flowletManager, cacheElementInfo } = options;

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
        if (cacheElementInfo) {
          // AdsALUIState.getOrCreateCachedInfo(node);
        }
        let info = activeSurfaces.get(surface);
        if (!info) {
          info = {
            surface,
            element: node,
            addTime: timestamp,
            addFlowlet: flowlet,
          };
          activeSurfaces.set(surface, info);
          emitSurfaceMutation(action, info);
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
          emitSurfaceMutation(action, info);
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


  function emitSurfaceMutation(
    action: 'added' | 'removed',
    info: SurfaceInfo
  ): void {
    const { removeTime, element } = info;
    switch (action) {
      case 'added': {
        channel.emit('al_mutation_event', {
          event: 'mount_component',
          eventTimestamp: info.addTime,
          eventIndex: ALEventIndex.getEventIndex(),
          element: info.element,
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          flowlet: info.addFlowlet,
          surface: info.surface,
          mutationImpl: 'surface',
        });
        break;
      }
      case 'removed': {
        if (removeTime == null) {
          // Not expect to happen, error
          break;
        }
        channel.emit('al_mutation_event', {
          event: 'unmount_component',
          eventTimestamp: removeTime,
          eventIndex: ALEventIndex.getEventIndex(),
          element,
          autoLoggingID: ALID.getOrSetAutoLoggingID(element),
          mountedDuration: (removeTime - info.addTime) / 1000,
          flowlet: info.removeFlowlet,
          surface: info.surface,
          mutationImpl: 'surface',
        });
        break;
      }
    }
  }
}
