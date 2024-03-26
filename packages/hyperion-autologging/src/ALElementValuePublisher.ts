/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { Channel } from "@hyperion/hook/src/Channel";
import * as IElement from "@hyperion/hyperion-dom/src/IElement";
import * as IHTMLInputElement from "@hyperion/hyperion-dom/src/IHTMLInputElement";
import * as Types from "@hyperion/hyperion-util/src/Types";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import ALElementInfo from "./ALElementInfo";
import * as ALEventIndex from "./ALEventIndex";
import * as ALID from './ALID';
import { ALElementTextEvent, getElementTextEvent } from './ALInteractableDOMElement';
import { ReactComponentData } from "./ALReactUtils";
import type { ALChannelSurfaceEvent } from "./ALSurface";
import { AUTO_LOGGING_SURFACE } from "./ALSurfaceConsts";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";
import { getAncestralSurfaceNode, getSurfacePath } from "./ALSurfaceUtils";
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

  const QueryString = (function () {
    /**
     * Some engines (e.g. Jest) may not be able to handle the more advanced
     * query selector (e.g. :has(...)).
     * The following code gracefully degrade to match the capabilities.
     */
    function tryQuery(query: string): string | null {
      try {
        document.querySelectorAll(query);
        return query;
      } catch (e) {
        console.error('Does not handle ', query);
      }
      return null;
    }

    return tryQuery(
      'input[type=radio][checked], input[type=checkbox][checked], select:has(option[selected])'
    ) ?? tryQuery(
      'input[type=radio][checked], input[type=checkbox][checked], select'
    ) ?? (
        'input[type=radio], input[type=checkbox], select'
      );
  })();

  function trackElementValues(surface: string, surfaceElement: Element) {
    // The following is expensive, so try to jam everything we are interested in to the selector
    const elements = surfaceElement.querySelectorAll<HTMLInputElement | HTMLSelectElement>(QueryString);
    if (!elements.length) {
      // Nothing to add
      return;
    }

    const relatedEventIndex = ALSurfaceMutationPublisher.getSurfaceMountInfo(surface)?.eventIndex;

    for (let i = 0; i < elements.length; ++i) {
      const element = elements[i];
      /**
       * The following function will look for 'interactable' surfaces, so the logic
       * automatically filter impression only surfaces. This ensure the logic stays
       * compatible with the UIEvent llogic.
       */
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

  /**
   * Sometimes in react, it first adds the empty input elements, and soon after updates the default value
   * based on props. In these cases, we do miss the elements in the above algorithm when parent surface is
   * mounted.
   * Using interception, we can not only catch such initialization, but also any future change to the value.
   * When combined with `change` ui event, we can track ALL changes to these input elements at any time.
   * TODO: we should decide if we want to have `change` event logged as is, or to file a new value event as well.
   */
  IHTMLInputElement.checked.setter.onBeforeCallObserverAdd(function (this, value) {
    if (value) {
      const surface = getSurfacePath(this);
      if (!surface) {
        return;
      }

      const relatedEventIndex = -1; // Find the last ui event event_index;
      emitEvent({
        element: this,
        surface,
        relatedEventIndex,
        value: 'true',
        metadata: {
          type: this.getAttribute('type') ?? '',
        }
      });
    }
  });

  /**
   * The following is an alternative way to ensure we can catch ANY surface wrapper regardless of how it is added.
   * However, for now will keep this disabled until we first understand the performance overhead of the rest of the algorithm.
   */
  false && IElement.setAttribute.onBeforeCallObserverAdd(function (this, attrName, attrValue) {
    if (attrName !== AUTO_LOGGING_SURFACE || !(this instanceof HTMLElement)) {
      return;
    }

    trackElementValues(attrValue, this);
  });
}
