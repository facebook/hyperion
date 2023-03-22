/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
import { ReactComponentObjectProps } from "@hyperion/hyperion-react/src/IReact";
import { onReactDOMElement } from "@hyperion/hyperion-react/src/IReactComponent";

'use strict';

const eventNamesMap: {
  [key: string]: (arg0: HTMLElement) => ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
} = {
  click: (node: HTMLElement) => {
    return node.onclick;
  },
  mouseover: (node: HTMLElement) => {
    return node.onmouseover;
  },
  mouseenter: (node: HTMLElement) => {
    return node.onmouseenter;
  },
  mouseout: (node: HTMLElement) => {
    return node.onmouseout;
  },
  mouseleave: (node: HTMLElement) => {
    return node.onmouseleave;
  },
};

const SYNTHETIC_EVENT_HANDLER_MAP: {
  [key: string]: string;
} = {
  click: 'onClick',
  contextmenu: 'onContextMenu',
  dblclick: 'onDoubleClick',
  drag: 'onDrag',
  dragend: 'onDragEnd',
  dragenter: 'onDragEnter',
  dragexit: 'onDragExit',
  dragleave: 'onDragLeave',
  dragover: 'onDragOver',
  dragstart: 'onDragStart',
  drop: 'onDrop',
  keydown: 'onKeyDown',
  keypress: 'onKeyPress',
  keyup: 'onKeyUp',
  mousedown: 'onMouseDown',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  mousemove: 'onMouseMove',
  mouseout: 'onMouseOut',
  mouseover: 'onMouseOver',
  mouseup: 'onMouseUp',
  submit: 'onSubmit',
};

export function getInteractable(
  node: EventTarget | null,
  eventName: string,
  returnInteractableNode: boolean = false,
): HTMLElement | null {
  const selectorString = `[data-${eventName}able="1"],input`;
  if (node instanceof HTMLElement) {
    const closestSelectorElement = node.closest(selectorString);
    if (
      closestSelectorElement == null ||
      (closestSelectorElement instanceof HTMLElement &&
        ignoreInteractiveElement(closestSelectorElement))
    ) {
      const closestHandler = getClosestHandler(node, eventName);
      return closestHandler != null
        ? returnInteractableNode
          ? closestHandler
          : node
        : null;
    } else {
      if (closestSelectorElement instanceof HTMLElement) {
        return returnInteractableNode ? closestSelectorElement : node;
      }
    }
  }
  return null;
}

function getClosestHandler(node: EventTarget, eventName: string): HTMLElement | null {
  if (node instanceof HTMLElement) {
    let handler;
    if (eventNamesMap[eventName] != null) {
      handler = eventNamesMap[eventName](node);
    }
    if (handler != null) {
      return ignoreInteractiveElement(node) ? null : node;
    } else {
      return node.parentElement != null
        ? getClosestHandler(node.parentElement, eventName)
        : null;
    }
  } else {
    return null;
  }
}

function ignoreInteractiveElement(node: HTMLElement) {
  const innerHeight: number = window.innerHeight;
  const innerWidth: number = window.innerWidth;
  return (
    node.tagName === 'BODY' ||
    node.tagName === 'HTML' ||
    (node.clientHeight === innerHeight && node.clientWidth === innerWidth)
  );
}

const TrackedEvents = new Set<string>();

let installHandlers = () => {
  IEventTarget.addEventListener.onArgsObserverAdd(function (
    this: EventTarget,
    event,
    _listener,
  ) {
    if (TrackedEvents.has(event) && this instanceof HTMLElement) {
      if (!ignoreInteractiveElement(this)) {
        const attribute = `data-${event}able`;

        this.setAttribute(attribute, '1');
      }
    }
  });

  IEventTarget.removeEventListener.onArgsObserverAdd(function (
    this: EventTarget,
    event,
    _listener,
  ) {
    if (this instanceof HTMLElement) {
      const attribute = `data-${event}able`;

      this.removeAttribute(attribute);
    }
  });

  onReactDOMElement.add((_component, props: ReactComponentObjectProps) => {
    if (props != null) {
      TrackedEvents.forEach(event => {
        if (props[SYNTHETIC_EVENT_HANDLER_MAP[event]] != null) {
          props[`data-${event}able`] = '1';
        }
      });
    }
  });

  installHandlers = () => { }; // Done doing stuff!
}

export function trackInteractable(events: Array<string>): void {
  installHandlers();
  events.forEach(event => TrackedEvents.add(event));
}

function isTruthy(value: any): boolean {
  return (
    /* Although Boolean(value) also captures null/undefined we need to add this
      check so that Flow refines value as non-nullable */
    value != null && Boolean(value)
  );
}

const extractInnerText = (element: HTMLElement | null): string | null => {
  const innerText = element?.innerText?.replace(
    // Remove zero-width invisible Unicode characters (https://stackoverflow.com/a/11305926)
    /[\u200B-\u200D\uFEFF]/g,
    '',
  );
  if (isTruthy(innerText)) {
    const innerTextArray = innerText?.split(/\r\n|\r|\n/);
    const name = (innerTextArray && innerTextArray.length > 0) ? innerTextArray[0] : null;
    if (name != null) {
      return name;
    }
  }
  return null;
};

export function getElementName(
  element: HTMLElement,
  // Whether to try to resolve if element name is a result of Fbt translation
): string | null {
  let nextElement: HTMLElement | null = element;
  while (nextElement && nextElement.nodeType === Node.ELEMENT_NODE) {
    const name = extractInnerText(nextElement);
    if (name != null) {
      return name;
    }
    nextElement = nextElement.parentElement;
  }
  return null;
}
