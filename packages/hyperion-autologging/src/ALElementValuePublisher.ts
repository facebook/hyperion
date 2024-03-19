/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALEventIndex from "./ALEventIndex";
import * as ALID from './ALID';
import { ALElementTextEvent, getElementTextEvent } from './ALInteractableDOMElement';
import { ALChannelSurfaceMutationEvent } from "./ALSurfaceMutationPublisher";
import { getAncestralSurfaceNode } from "./ALSurfaceUtils";
import { ALElementEvent, ALFlowletEvent, ALLoggableEvent, ALMetadataEvent, ALReactElementEvent, ALSharedInitOptions } from "./ALType";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import { ReactComponentData } from "./ALReactUtils";
import ALElementInfo from "./ALElementInfo";

export type ALElementValueEventData = Readonly<
  ALLoggableEvent &
  ALFlowletEvent &
  ALReactElementEvent &
  ALElementTextEvent &
  ALMetadataEvent &
  ALElementEvent &
  {
    surface: string;
    value: string | boolean;
  }
>;

export type ALChannelElementValueEvent = Readonly<{
  al_element_value_event: [ALElementValueEventData],
}
>;

export type ALElementValueChannel = Channel<ALChannelElementValueEvent & ALChannelSurfaceMutationEvent>;


export type InitOptions = Types.Options<
  ALSharedInitOptions &
  {
    channel: ALElementValueChannel;
    cacheElementReactInfo: boolean;
  }
>;

export function publish(options: InitOptions): void {
  const { channel } = options;

  channel.addListener('al_surface_mutation_event', surfaceEventData => {
    const surfaceElement = surfaceEventData.element;
    const surface = surfaceEventData.surface;

    if (surfaceEventData.event !== 'mount_component' || !surface == null || !surfaceElement) {
      return;
    }
    // The following is expensive, so try to jam everything we are interested in to the selector
    const elements = surfaceElement.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[type=radio], input[type=checkbox], select');

    if (!elements.length) {
      // Nothing to add
      return;
    }

    for (let i = 0; i < elements.length; ++i) {
      const element = elements[i];
      const parentSurfaceNode = getAncestralSurfaceNode(element);
      if (parentSurfaceNode === surfaceElement) {
        // We know value is part of this surface only
        const elementText = getElementTextEvent(element, surface);
        let elementValueEventData: Pick<ALElementValueEventData, "value" | "metadata"> | null = null;

        switch (element.nodeName) {
          case 'INPUT': {
            const input = element as HTMLInputElement;
            if (input.checked) {
              elementValueEventData = {
                value: input.checked,
                metadata: {
                  type: input.getAttribute('type') ?? '',
                }
              }
            }
            break;
          }
          case 'SELECT': {
            const select = element as HTMLSelectElement;
            if (select.selectedIndex > -1) {
              elementValueEventData = {
                value: select.value,
                metadata: {
                  type: 'select',
                  text: select.options[select.selectedIndex].text
                }
              }
            }
            break;
          }

        }
        if (elementValueEventData) {
          let reactComponentData: ReactComponentData | null = null;
          if (options.cacheElementReactInfo) {
            const elementInfo = ALElementInfo.getOrCreate(element);
            reactComponentData = elementInfo.getReactComponentData();
          }

          const flowlet = options.flowletManager.top();


          channel.emit('al_element_value_event', {
            eventIndex: ALEventIndex.getNextEventIndex(),
            relatedEventIndex: surfaceEventData.eventIndex,
            eventTimestamp: performanceAbsoluteNow(),
            element,
            autoLoggingID: ALID.getOrSetAutoLoggingID(element),
            surface,
            flowlet,
            triggerFlowlet: flowlet.data.triggerFlowlet,
            ...elementText,
            ...elementValueEventData,
            reactComponentName: reactComponentData?.name,
            reactComponentStack: reactComponentData?.stack,
          });
        }

      }
    }
  });
}
