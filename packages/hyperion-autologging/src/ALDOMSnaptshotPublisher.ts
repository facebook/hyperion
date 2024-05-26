/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';


import { ChannelEventType } from "@hyperion/hyperion-channel/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import { ALSharedInitOptions } from "./ALType";
import * as ALUIEventPublisher from "./ALUIEventPublisher";
import { ALCustomEventChannel, emitALCustomEvent } from "./ALCustomEvent";



export type InitOptions = Types.Options<
  ALSharedInitOptions<ChannelEventType<(ALUIEventPublisher.InitOptions)['channel'] & ALCustomEventChannel>>
// Later we can add config similar to UIEventPublisher to better control snapshiots
>;

export function publish(options: InitOptions): void {
  const { channel, flowletManager } = options;

  function copyNodeStyle(sourceNode: HTMLElement, targetNode: HTMLElement) {
    const computedStyle = window.getComputedStyle(sourceNode);
    Array.from(computedStyle).forEach(key => targetNode.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key)))
  }
  function getSnapshot<T extends Node>(node: T): T {
    const clone = node.cloneNode() as T;
    if (clone instanceof HTMLElement && node instanceof HTMLElement) {
      copyNodeStyle(node, clone);
      for (let child = node.firstChild; child; child = child.nextSibling) {
        clone.appendChild(getSnapshot(child));
      }
    }
    return clone;
  }

  channel.addListener('al_ui_event', eventData => {
    const { event, element } = eventData;
    if (event !== 'click' || !element) {
      return;
    }

    const clone = getSnapshot(element);
    const snapshot = clone.outerHTML;
    const customEvent = emitALCustomEvent(
      channel,
      flowletManager,
      {
        event_name: "dom_snapshot",
        snapshot,
      },
      {
        relatedEventIndex: eventData.eventIndex,
      }
    );
    eventData.metadata.snapshot_event_index = '' + customEvent.eventIndex;
    eventData.metadata.snapshot = snapshot
  });
} 