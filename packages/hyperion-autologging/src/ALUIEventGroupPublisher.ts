/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import * as Types from "@hyperion/hyperion-util/src/Types";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import { IALFlowlet } from "./ALFlowletManager";
import { ALSharedInitOptions } from "./ALType";
import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";


enum UIEventGroup {
  MOUSE = 'mouse',
  KEY = 'key',
}

interface GroupFlowletInfo {
  groupFlowlet: IALFlowlet,
  type: UIEventGroup,
  eventOrder: number;
  eventName?: string;
  target?: Element;
}

const GroupFlowlets = new Map<EventTarget, GroupFlowletInfo>(); // TODO: should we use a WeakMap

const EventInfo: {
  [key in keyof GlobalEventHandlersEventMap]?: {
    order: number;
    groupType: UIEventGroup;
  }
} = {};
([ //https://patrickhlauke.github.io/touch/tests/event-listener_mouse-only.html
  ['mouseover', 'mouseenter'],
  // ['mousemove'], // We dont really seem to need this, and it may cause perf regression
  ['mousedown', 'mouseup', 'click', /* 'dbclick' */],
  ['mouseout', 'mouseleave']
] as const).reduce(
  (prev, events, index) => {
    events.forEach(event => {
      prev[event] = {
        order: index,
        groupType: UIEventGroup.MOUSE
      }
    });
    return prev;
  },
  EventInfo
);

export type InitOptions = Types.Options<
  Pick<ALSharedInitOptions, 'flowletManager'>
>;
let _options: InitOptions | null = null;

export function isSupported(eventType: string): boolean {
  return eventType in EventInfo;
}

export function getGroupRootFlowlet(event: Event): IALFlowlet | null | undefined {
  const targetElement = event.target;
  const eventInfo = EventInfo[event.type as keyof GlobalEventHandlersEventMap]; // We do know event.type is a valid name
  if (targetElement instanceof Element && eventInfo && _options) {
    let groupRootFlowlet = GroupFlowlets.get(targetElement);
    if (
      groupRootFlowlet
      && groupRootFlowlet.eventOrder <= eventInfo.order
      && groupRootFlowlet.type === eventInfo.groupType
    ) {
      groupRootFlowlet.eventOrder = eventInfo.order;
      groupRootFlowlet.eventName = event.type;
      return groupRootFlowlet.groupFlowlet;
    }

    const type = eventInfo.groupType;
    const groupFlowlet = new _options.flowletManager.flowletCtor(`${type}(ts:${performanceAbsoluteNow()})`);
    groupRootFlowlet = {
      groupFlowlet,
      type,
      eventOrder: eventInfo.order,
    }
    if (__DEV__) {
      // The following is useful during debugging
      groupRootFlowlet.eventName = event.type;
      groupRootFlowlet.target = targetElement;

    }
    GroupFlowlets.set(targetElement, groupRootFlowlet);
    return groupFlowlet;
  }
  return null;
}

let initialized = new TestAndSet();
export function init(options: InitOptions) {
  if (initialized.testAndSet()) {
    return;
  }
  _options = options;
}
