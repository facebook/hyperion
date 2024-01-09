/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';
import * as Types from "@hyperion/hyperion-util/src/Types";
import { IALFlowlet } from "./ALFlowletManager";
import { ALSharedInitOptions } from "./ALType";
import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";


enum UIEventGroup {
  MOUSE = 'mouse',
  KEY = 'key',
  INPUT = 'input',
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
function updateInfo(type: UIEventGroup, events: ((keyof GlobalEventHandlersEventMap)[])[]) {
  events.reduce(
    (prev, events, index) => {
      events.forEach(event => {
        prev[event] = {
          order: index,
          groupType: type
        }
      });
      return prev;
    },
    EventInfo
  );
}
updateInfo(
  UIEventGroup.MOUSE,
  [ //https://patrickhlauke.github.io/touch/tests/event-listener_mouse-only.html
    ['mouseover', 'mouseenter'],
    // ['mousemove'], // We dont really seem to need this, and it may cause perf regression
    ['mousedown', 'mouseup', 'click', /* 'dbclick' */],
    ['mouseout', 'mouseleave']
  ]
);
updateInfo(
  UIEventGroup.INPUT,
  [ //https://patrickhlauke.github.io/touch
    ['input', 'change'],
  ]
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
    /**
     * As we keep track all root flowlets for the trigger flowlet tracking
     * we use a common parent for all ui events to avoid tracking each ui event's
     * flowlet individually.
     */
    const groupFlowlet = new _options.flowletManager.flowletCtor(type, _options.flowletManager.root);
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
  return _options?.flowletManager.root;
}

let initialized = new TestAndSet();
export function init(options: InitOptions) {
  if (initialized.testAndSet()) {
    return;
  }
  _options = options;
}
