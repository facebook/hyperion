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


const GroupFlowlets = new Map<EventTarget, { // TODO: should we use a WeakMap
  groupFlowlet: IALFlowlet,
  type: UIEventGroup,
  firstEventOrder: number;
}>();

const EventInfo: {
  [key: string]: {
    order: number;
    groupType: UIEventGroup;
  }
} = {};
([ //https://patrickhlauke.github.io/touch/tests/event-listener_mouse-only.html
  'mouseover',
  'mouseenter',
  'mousemove',
  'mousedown',
  'mouseup',
  'click',
  // 'dbclick',
  'mouseout',
  'mouseleave',
] as const).reduce(
  (prev, event: keyof GlobalEventHandlersEventMap, index) => {
    prev[event] = {
      order: index,
      groupType: UIEventGroup.MOUSE
    };
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
  const eventInfo = EventInfo[event.type];
  if (targetElement && eventInfo && _options) {
    let groupRootFlowlet = GroupFlowlets.get(targetElement);
    if (
      !groupRootFlowlet
      || eventInfo.order < groupRootFlowlet.firstEventOrder
      || eventInfo.groupType !== groupRootFlowlet.type
    ) {
      const type = eventInfo.groupType;
      const groupFlowlet = new _options.flowletManager.flowletCtor(`${type}(ts:${performanceAbsoluteNow()})`);
      GroupFlowlets.set(targetElement, {
        groupFlowlet,
        type,
        firstEventOrder: eventInfo.order
      });
      return groupFlowlet;
    } else {
      return groupRootFlowlet.groupFlowlet;
    }
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
