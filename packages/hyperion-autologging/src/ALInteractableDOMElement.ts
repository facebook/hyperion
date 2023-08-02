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

const extractInnerText = (element: HTMLElement | null): string | null => {
  const innerText = element?.innerText?.replace(
    // Remove zero-width invisible Unicode characters (https://stackoverflow.com/a/11305926)
    /[\u200B-\u200D\uFEFF]/g,
    '',
  );
  if (innerText) {
    const innerTextArray = innerText.split(/\r\n|\r|\n/);
    const name = (innerTextArray && innerTextArray.length > 0) ? innerTextArray[0] : null;
    if (name != null) {
      return name;
    }
  }
  return null;
};

export type ALElementText = {
  /// Element text extracted from element
  text: string,

  /// The source attribute where we got the elementName from
  readonly source: 'innerText' | 'aria-label' | 'aria-labelledby' | 'aria-description' | 'aria-describedby';
};

export type ALElementTextEvent = Readonly<{
  // Element text extracted from element
  elementName: string | null,
  elementText: ALElementText | null;
}>;

export type ALDOMTextSource = {
  surface: string | null;
  directSource: HTMLElement;
  indirectSources?: HTMLElement[] | null;
}

export type ALElementTextOptions = Readonly<{
  updateText: <T extends ALElementText>(elementText: T, domSource: ALDOMTextSource) => void;
}>;

let _options: ALElementTextOptions | null = null;
export function init(options: ALElementTextOptions) {
  _options = options;
}

function callExternalTextProcessor(
  elementText: ALElementText,
  domSource: ALDOMTextSource,
): ALElementText {
  _options?.updateText(elementText, domSource);
  return elementText;
}

// Takes a space-delimited list of DOM element IDs and returns the inner text of those elements joined by spaces
function getTextFromElementsByIds(domSource: ALDOMTextSource, source: ALElementText['source']): ALElementText | null {
  const indirectSources = domSource.directSource
    .getAttribute(source)
    ?.split(' ')
    .map(id => document.getElementById(id))
    .filter(function (element): element is HTMLElement { return element instanceof HTMLElement });
  const fullText = indirectSources?.map(extractInnerText).filter(text => text != null).join(' ');
  if (fullText != null && fullText !== '') {
    domSource.indirectSources = indirectSources
    return callExternalTextProcessor(
      {
        text: fullText,
        source,
      },
      domSource
    );
  }
  return null;
}

function getTextFromElementAttribute(domSource: ALDOMTextSource, source: ALElementText['source']): ALElementText | null {
  const label = domSource.directSource.getAttribute(source);
  if (label != null && label !== '') {
    return callExternalTextProcessor(
      {
        text: label,
        source
      },
      domSource
    );
  }
  return null;
}

function getTextFromInnerText(domSource: ALDOMTextSource, source: ALElementText['source']): ALElementText | null {
  const text = extractInnerText(domSource.directSource);
  if (text != null && text !== '') {
    return callExternalTextProcessor(
      {
        text,
        source
      },
      domSource
    );
  }
  return null;
}

export function getElementName(element: HTMLElement, surface: string | null): ALElementText | null {
  const domSource: ALDOMTextSource = {
    directSource: element,
    surface
  };
  for (
    let nextElement: HTMLElement | null = element;
    nextElement && nextElement.nodeType === Node.ELEMENT_NODE;
    nextElement = nextElement.parentElement
  ) {

    const text = getTextFromElementsByIds(domSource, 'aria-labelledby')
      ?? getTextFromElementAttribute(domSource, 'aria-label')
      ?? getTextFromElementAttribute(domSource, 'aria-description')
      ?? getTextFromElementsByIds(domSource, 'aria-describedby')
      ?? getTextFromInnerText(domSource, 'innerText')
      // ?? TODO: add support for <label for=''> later
      ;
    if (text) {
      return text;
    }
  }
  return null;
}

export function getElementTextEvent(element: HTMLElement | null, surface: string | null): ALElementTextEvent {
  if (!element) {
    return {
      elementName: null,
      elementText: null,
    }
  }
  const elementText = getElementName(element, surface);
  return {
    elementName: elementText?.text ?? null,
    elementText,
  };
}