/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
import { ReactComponentObjectProps } from "@hyperion/hyperion-react/src/IReact";
import { onReactDOMElement } from "@hyperion/hyperion-react/src/IReactComponent";

'use strict';

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

type HTMLElementEventNames = keyof HTMLElementEventMap
type AttributeEventHandlerName = `on${HTMLElementEventNames}`;
type HTMLElementWithHandlers = HTMLElement & {
  [K in AttributeEventHandlerName]?: any;//  ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
}

function eventHandlerTrackerAttribute(eventName: string): string {
  return `data-${eventName}able`;
}

export function getInteractable(
  node: EventTarget | null,
  eventName: string,
  returnInteractableNode: boolean = false,
): HTMLElement | null {
  // https://www.w3.org/TR/2011/WD-html5-20110525/interactive-elements.html
  const selectorString = `[${eventHandlerTrackerAttribute(eventName)}="1"],input,button,select,option,details,dialog,summary`;
  if (node instanceof HTMLElement) {
    const closestSelectorElement = node.closest(selectorString);
    if (
      closestSelectorElement == null ||
      (closestSelectorElement instanceof HTMLElement &&
        ignoreInteractiveElement(closestSelectorElement))
    ) {
      const closestHandler = getClosestElementWithHandler(node, eventName as HTMLElementEventNames); // we already know node is HTMLElement
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

function getClosestElementWithHandler(node: HTMLElementWithHandlers, eventName: HTMLElementEventNames): HTMLElement | null {
  const handler = node[`on${eventName}`];
  if (handler != null) {
    return ignoreInteractiveElement(node) ? null : node;
  } else {
    return node.parentElement != null
      ? getClosestElementWithHandler(node.parentElement, eventName)
      : null;
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
        const attribute = eventHandlerTrackerAttribute(event);
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
      const attribute = eventHandlerTrackerAttribute(event);
      this.removeAttribute(attribute);
    }
  });

  onReactDOMElement.add((_component, props: ReactComponentObjectProps) => {
    if (props != null) {
      TrackedEvents.forEach(event => {
        if (props[SYNTHETIC_EVENT_HANDLER_MAP[event]] != null) {
          props[eventHandlerTrackerAttribute(event)] = '1';
        }
      });
    }
  });

  installHandlers = () => { }; // Done doing stuff!
}

export function trackInteractable(eventName: string): boolean {
  installHandlers();
  const alreadyTracked = TrackedEvents.has(eventName);
  TrackedEvents.add(eventName);
  return alreadyTracked;
}

export function extractCleanText(text: string): string {
  const cleanText = text.replace(
    // Remove zero-width invisible Unicode characters (https://stackoverflow.com/a/11305926)
    /[\u200B-\u200D\uFEFF]/g,
    '',
  );
  if (cleanText) {
    const lines = cleanText.split(/\r\n|\r|\n/);
    const name = (lines && lines.length > 0) ? lines[0] : null;
    if (name != null) {
      return name;
    }
  }
  return "";
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
  element: HTMLElement;
}

export type ALElementTextOptions = Readonly<{
  maxDepth?: number;
  updateText?: <T extends ALElementText>(elementText: T, domSource: ALDOMTextSource) => void;
  getText?: <T extends ALElementText>(elementTexts: T[]) => ALElementText;
}>;

let _options: ALElementTextOptions | null = null;
let MaxDepth = 20;
export function init(options: ALElementTextOptions) {
  _options = options;
  MaxDepth = _options.maxDepth ?? MaxDepth;
}

function callExternalTextProcessor(
  elementText: ALElementText,
  domSource: ALDOMTextSource,
  results: ALElementText[]
): ALElementText[] {
  _options?.updateText?.(elementText, domSource);
  results.push(elementText);
  return results;
}

function getTextFromTextNode(domSource: ALDOMTextSource, textNode: Text, results: ALElementText[]): ALElementText[] | null {
  const text = textNode.nodeValue;
  if (text != null && text !== '') {
    return callExternalTextProcessor(
      {
        text,
        source: 'innerText'
      },
      domSource,
      results
    );

  }
  return null;
}


// Takes a space-delimited list of DOM element IDs and returns the inner text of those elements joined by spaces
function getTextFromElementsByIds(domSource: ALDOMTextSource, source: ALElementText['source'], results: ALElementText[]): ALElementText[] | null {
  const indirectSources = domSource.element
    .getAttribute(source)
    ?.split(' ')
    .map(id => document.getElementById(id))
    .filter(function (element): element is HTMLElement { return element instanceof HTMLElement });
  if (!indirectSources?.length) {
    return null;
  }

  for (let i = 0; i < indirectSources.length; i++) {
    domSource.element = indirectSources[i];
    getTextFromInnerText(domSource, source, results);
  }

  return results;
}

function getTextFromElementAttribute(domSource: ALDOMTextSource, source: ALElementText['source'], results: ALElementText[]): ALElementText[] | null {
  const label = domSource.element.getAttribute(source);
  if (label != null && label !== '') {
    return callExternalTextProcessor(
      {
        text: label,
        source
      },
      domSource,
      results
    );
  }
  return null;
}

function getTextFromInnerText(domSource: ALDOMTextSource, source: ALElementText['source'], results: ALElementText[]): ALElementText[] | null {
  const text = domSource.element.textContent; // Jest does not support innerText, https://github.com/jsdom/jsdom/issues/1245
  if (text != null && text !== '') {
    return callExternalTextProcessor(
      {
        text,
        source
      },
      domSource,
      results
    );
  }
  return null;
}

function getElementName(element: HTMLElement, surface: string | null, results: ALElementText[], depth = 0): void {
  if (depth > MaxDepth) {
    return;
  }

  const domSource: ALDOMTextSource = {
    element: element,
    surface
  };

  /**
   * First we check if the element itself has some definitive text we can use
   */
  const selfText = getTextFromElementsByIds(domSource, 'aria-labelledby', results)
    ?? getTextFromElementAttribute(domSource, 'aria-label', results)
    ?? getTextFromElementAttribute(domSource, 'aria-description', results)
    ?? getTextFromElementsByIds(domSource, 'aria-describedby', results)
    ;

  if (!selfText) {
    /**
     * Now we recurse into the children to find other text candidates.
     */
    for (
      let child = element.firstChild; child; child = child.nextSibling) {
      if (child instanceof HTMLElement && child.nodeType === Node.ELEMENT_NODE) {
        getElementName(child, surface, results, depth + 1);
      } else if (child instanceof Text && child.nodeType === Node.TEXT_NODE) {
        getTextFromTextNode({ element: element, surface }, child, results);
      }
    }
  }
}

export function getElementTextEvent(element: HTMLElement | null, surface: string | null): ALElementTextEvent {
  if (!element) {
    return {
      elementName: null,
      elementText: null,
    }
  }
  const results: ALElementText[] = [];
  getElementName(element, surface, results);
  const elementText = _options?.getText?.(results) ?? results.reduce(
    (prev, current) => {
      /**
       * We want to ensure that if _options.updateText has changed individual objects
       * we can still maintain that structure and pass it back to _options.reduceText
       * Therefore, we spread both prev and current bellow
       */
      const cleanText = extractCleanText(current.text);
      const next: ALElementText = {
        ...prev,
        ...current,
        text: prev.text + cleanText,
      };
      return next;
    },
    {
      text: "",
      source: 'innerText'
    }
  );
  return {
    elementName: elementText?.text ?? null,
    elementText,
  };
}