/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import ALElementInfo from "./ALElementInfo";
import * as ALEventIndex from "./ALEventIndex";
import * as ALID from './ALID';
import { ALElementTextEvent, getElementTextEvent } from './ALInteractableDOMElement';
import { ReactComponentData } from "./ALReactUtils";
import type { ALChannelSurfaceEvent } from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";
import { getAncestralSurfaceNode } from "./ALSurfaceUtils";
import { ALElementEvent, ALFlowletEvent, ALLoggableEvent, ALMetadataEvent, ALReactElementEvent, ALSharedInitOptions } from "./ALType";

export type ALElementValueEventData = Readonly<
  ALLoggableEvent &
  ALFlowletEvent &
  ALReactElementEvent &
  ALElementTextEvent &
  ALMetadataEvent &
  ALElementEvent &
  {
    surface: string;
    value: string;
  }
>;

export type ALChannelElementValueEvent = Readonly<{
  al_element_value_event: [ALElementValueEventData],
}
>;

export type ALElementValueChannel = Channel<ALChannelElementValueEvent & ALChannelSurfaceEvent>;


export type InitOptions = Types.Options<
  ALSharedInitOptions &
  {
    channel: ALElementValueChannel;
    cacheElementReactInfo: boolean;
  }
>;

export function publish(options: InitOptions): void {
  const { channel } = options;

  type PartialALEventValueEventData = Pick<ALElementValueEventData, "surface" | "element" | "value" | "metadata" | "relatedEventIndex">;
  function emitEvent(elementValueEventData: PartialALEventValueEventData) {
    const { element, surface } = elementValueEventData;

    const elementText = getElementTextEvent(element, surface);

    let reactComponentData: ReactComponentData | null = null;
    if (options.cacheElementReactInfo) {
      const elementInfo = ALElementInfo.getOrCreate(element);
      reactComponentData = elementInfo.getReactComponentData();
    }

    const flowlet = options.flowletManager.top();

    channel.emit('al_element_value_event', {
      ...elementValueEventData,
      eventIndex: ALEventIndex.getNextEventIndex(),
      eventTimestamp: performanceAbsoluteNow(),
      autoLoggingID: ALID.getOrSetAutoLoggingID(element),
      flowlet,
      triggerFlowlet: flowlet.data.triggerFlowlet,
      ...elementText,
      reactComponentName: reactComponentData?.name,
      reactComponentStack: reactComponentData?.stack,
    });
  }

  function trackElementValues(surface: string, surfaceElement: Element) {
    // The following is expensive, so try to jam everything we are interested in to the selector
    const elements = surfaceElement.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[type=radio], input[type=checkbox], select');

    if (!elements.length) {
      // Nothing to add
      return;
    }

    const relatedEventIndex = ALSurfaceMutationPublisher.getSurfaceMountInfo(surface)?.eventIndex;

    for (let i = 0; i < elements.length; ++i) {
      const element = elements[i];
      const parentSurfaceNode = getAncestralSurfaceNode(element);
      if (parentSurfaceNode === surfaceElement) {
        // We know value is part of this surface only

        switch (element.nodeName) {
          case 'INPUT': {
            const input = element as HTMLInputElement;
            if (input.checked) {
              emitEvent({
                surface,
                element,
                relatedEventIndex,
                value: 'true',
                metadata: {
                  type: input.getAttribute('type') ?? '',
                }
              });
            }
            break;
          }
          case 'SELECT': {
            const select = element as HTMLSelectElement;
            if (select.selectedIndex > -1) {
              emitEvent({
                surface,
                element,
                relatedEventIndex,
                value: select.value,
                metadata: {
                  type: 'select',
                  text: select.options[select.selectedIndex].text
                }
              });
            }
            break;
          }
        }
      }
    }
  }

  channel.addListener('al_surface_mount', surfaceEventData => {
    const surfaceElement = surfaceEventData.element;
    const surface = surfaceEventData.surface;

    if (!surface == null || !surfaceElement) {
      return;
    }

    trackElementValues(surface, surfaceElement);
  });
}
