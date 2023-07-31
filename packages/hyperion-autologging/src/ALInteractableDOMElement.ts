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

export type ALElementText = Readonly<{
  /// Element text extracted from element
  text: string,

  /// The source attribute where we got the elementName from
  source: 'innerText' | 'aria-label' | 'aria-labelledby' | 'aria-description' | 'aria-describedby';
}>;

export type ALElementTextEvent = Readonly<{
  // Element text extracted from element
  elementName: string | null,
  elementText: ALElementText | null;
}>


// Takes a space-delimited list of DOM element IDs and returns the inner text of those elements joined by spaces
function getTextFromElementsByIds(ids: string): string | null {
  const fullText = ids.split(' ').map(id => {
    const element = document.getElementById(id);
    if (element != null) {
      const text = extractInnerText(element);
      if (text != null) {
        return text;
      }
    }
    return null;
  }).join(' ');
  if (fullText != null && fullText !== '') {
    return fullText;
  }
  return null;
}

export function getElementName(
  element: HTMLElement,
  // Whether to try to resolve if element name is a result of Fbt translation
): ALElementText | null {
  let nextElement: HTMLElement | null = element;
  while (nextElement && nextElement.nodeType === Node.ELEMENT_NODE) {

    const labelledBy = nextElement.getAttribute('aria-labelledby');
    if (labelledBy != null) {
      const labelText = getTextFromElementsByIds(labelledBy);
      if (labelText != null && labelText !== '') {
        return {
          text: labelText,
          source: 'aria-labelledby'
        };
      }
      // const fullLabel = labelledBy.split(' ').map(labelledBy => {
      //   const labelElement = document.getElementById(labelledBy);
      //   if (labelElement != null) {
      //     const labelText = extractInnerText(labelElement);
      //     if (labelText != null) {
      //         return labelText
      //     }
      //   }
      //   return null;
      // });
      // const fullLabelText = fullLabel.join(' ');
      // if (fullLabelText != null && fullLabelText !== '') {
      //   return {
      //     text: fullLabelText,
      //     source: 'aria-labelledby',
      //   };
      // }
    }

    const label = nextElement.getAttribute('aria-label');
    if (label != null && label !== '') {
      return { text: label, source: 'aria-label' };
    }

    const description = nextElement.getAttribute('aria-description');
    if (description != null && description !== '') {
      return {
        text: description,
        source: 'aria-description',
      };
    }

    const describedBy = nextElement.getAttribute('aria-describedby');
    if (describedBy != null) {
      const descText = getTextFromElementsByIds(describedBy);
      if (descText != null && descText !== '') {
        return {
          text: descText,
          source: 'aria-describedby',
        }
      }
      // const fullDesc = describedBy.split(' ').map(describedBy => {
      //   const descElement = document.getElementById(describedBy);
      //   if (descElement != null) {
      //     const descText = extractInnerText(descElement);
      //     if (descText != null) {
      //       return descText;

      //     }
      //   }
      //   return null;
      // });
      // const fullDescText = fullDesc.join(' ');

      // if (fullDescText != null && fullDescText !== '') {
      //   return {
      //     text: fullDescText,
      //     source: 'aria-describedby',
      //   };
      // }
    }

    const name = extractInnerText(nextElement);
    if (name != null && name !== '') {
      return { text: name, source: 'innerText' };
    }

    nextElement = nextElement.parentElement;
  }
  return null;
}

export function getElementTextEvent(element: HTMLElement | null): ALElementTextEvent {
  if (!element) {
    return {
      elementName: null,
      elementText: null,
    }
  }
  const elementText = getElementName(element);
  return {
    elementName: elementText?.text ?? null,
    elementText,
  };
}