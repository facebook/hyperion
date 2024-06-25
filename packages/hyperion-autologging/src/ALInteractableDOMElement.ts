/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
// import * as IGlobalEventHandlers from "@hyperion/hyperion-dom/src/IGlobalEventHandlers";
import { ReactComponentObjectProps } from "@hyperion/hyperion-react/src/IReact";
import * as IReactComponent from "@hyperion/hyperion-react/src/IReactComponent";
import type * as Types from "@hyperion/hyperion-util/src/Types";
import type { UIEventConfig } from "./ALUIEventPublisher";

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
  eventName: UIEventConfig['eventName'],
  returnInteractableNode: boolean = false,
  // Whether to require an actual handler is assigned to determine interactiveness, rather than including "interactive" element tags
  requireHandlerAssigned: boolean = false,
): HTMLElement | null {
  // https://www.w3.org/TR/2011/WD-html5-20110525/interactive-elements.html
  const selectorString = `[${eventHandlerTrackerAttribute(eventName)}="1"]${requireHandlerAssigned ? '' : ',input,button,select,option,details,dialog,summary,a[href]'}`;
  if (node instanceof HTMLElement) {
    for (let element: HTMLElement | null = node; element != null; element = element.parentElement) {
      if (element.matches(selectorString) || elementHasEventHandler(element, eventName as HTMLElementEventNames)) {
        if (ignoreInteractiveElement(element)) {
          continue;
        }
        return returnInteractableNode ? element : node;
      }
    }
  }
  return null;
}

function elementHasEventHandler(node: HTMLElementWithHandlers, eventName: HTMLElementEventNames): boolean {
  const handler = node[`on${eventName}`];
  return handler != null;
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

// Keep track of event handlers
export type TrackEventHandlerConfig = Readonly<{
  captureHandler: (event: Event) => void,
  bubbleHandler: (event: Event) => void,
  active: boolean,
}>;
const UIEventHandlers = new Map<UIEventConfig['eventName'] | string, TrackEventHandlerConfig>;
export const UIEventNames = new Set<UIEventConfig['eventName'] | string>;

export function disableUIEventHandlers(eventName: UIEventConfig['eventName']): void {
  const handlerConfig = UIEventHandlers.get(eventName);
  if (handlerConfig?.active === true) {
    window.document.removeEventListener(eventName, handlerConfig.captureHandler, true);
    window.document.removeEventListener(eventName, handlerConfig.bubbleHandler, false);
    UIEventNames.delete(eventName);
    UIEventHandlers.set(eventName, {
      ...handlerConfig,
      active: false,
    });
  }
}

export function enableUIEventHandlers(eventName: UIEventConfig['eventName'], eventHandlerConfig?: Omit<TrackEventHandlerConfig, "active"> | undefined): void {
  let handlerConfig = UIEventHandlers.get(eventName);
  // Incoming config
  if (eventHandlerConfig != null) {
    // Disable the existing handlers if present, before installing the new ones
    disableUIEventHandlers(eventName);
    handlerConfig = { ...eventHandlerConfig, active: false };
  }
  if (handlerConfig?.active === false) {
    // Install interactable attribute handlers
    installHandlers();
    // Install event handlers
    window.document.addEventListener(eventName, handlerConfig.captureHandler, true);
    window.document.addEventListener(eventName, handlerConfig.bubbleHandler, false);
    UIEventNames.add(eventName);
    UIEventHandlers.set(eventName, {
      ...handlerConfig,
      active: true,
    });
  }
}

let installHandlers = () => {
  IEventTarget.addEventListener.onBeforeCallObserverAdd(function (
    this: EventTarget,
    event,
    _listener,
  ) {
    if (UIEventNames.has(event) && this instanceof HTMLElement) {
      if (!ignoreInteractiveElement(this)) {
        const attribute = eventHandlerTrackerAttribute(event);
        this.setAttribute(attribute, '1');
      }
    }
  });

  IEventTarget.removeEventListener.onBeforeCallObserverAdd(function (
    this: EventTarget,
    event,
    _listener,
  ) {
    if (this instanceof HTMLElement) {
      const attribute = eventHandlerTrackerAttribute(event);
      this.removeAttribute(attribute);
    }
  });

  IReactComponent.onReactDOMElement.add((_component, props: ReactComponentObjectProps) => {
    if (props != null) {
      UIEventNames.forEach(event => {
        if (props[SYNTHETIC_EVENT_HANDLER_MAP[event]] != null) {
          props[eventHandlerTrackerAttribute(event)] = '1';
        }
      });
    }
  });

  // for (const eventHandler of [
  //   IGlobalEventHandlers.onabort,
  //   IGlobalEventHandlers.onanimationcancel,
  //   IGlobalEventHandlers.onanimationend,
  //   IGlobalEventHandlers.onanimationiteration,
  //   IGlobalEventHandlers.onanimationstart,
  //   IGlobalEventHandlers.onauxclick,
  //   IGlobalEventHandlers.onblur,
  //   IGlobalEventHandlers.oncanplay,
  //   IGlobalEventHandlers.oncanplaythrough,
  //   IGlobalEventHandlers.onchange,
  //   IGlobalEventHandlers.onclick,
  //   IGlobalEventHandlers.onclose,
  //   IGlobalEventHandlers.oncontextmenu,
  //   IGlobalEventHandlers.oncuechange,
  //   IGlobalEventHandlers.ondblclick,
  //   IGlobalEventHandlers.ondrag,
  //   IGlobalEventHandlers.ondragend,
  //   IGlobalEventHandlers.ondragenter,
  //   IGlobalEventHandlers.ondragleave,
  //   IGlobalEventHandlers.ondragover,
  //   IGlobalEventHandlers.ondragstart,
  //   IGlobalEventHandlers.ondrop,
  //   IGlobalEventHandlers.ondurationchange,
  //   IGlobalEventHandlers.onemptied,
  //   IGlobalEventHandlers.onended,
  //   IGlobalEventHandlers.onfocus,
  //   IGlobalEventHandlers.onformdata,
  //   IGlobalEventHandlers.ongotpointercapture,
  //   IGlobalEventHandlers.oninput,
  //   IGlobalEventHandlers.oninvalid,
  //   IGlobalEventHandlers.onkeydown,
  //   IGlobalEventHandlers.onkeypress,
  //   IGlobalEventHandlers.onkeyup,
  //   IGlobalEventHandlers.onload,
  //   IGlobalEventHandlers.onloadeddata,
  //   IGlobalEventHandlers.onloadedmetadata,
  //   IGlobalEventHandlers.onloadstart,
  //   IGlobalEventHandlers.onlostpointercapture,
  //   IGlobalEventHandlers.onmousedown,
  //   IGlobalEventHandlers.onmouseenter,
  //   IGlobalEventHandlers.onmouseleave,
  //   IGlobalEventHandlers.onmousemove,
  //   IGlobalEventHandlers.onmouseout,
  //   IGlobalEventHandlers.onmouseover,
  //   IGlobalEventHandlers.onmouseup,
  //   IGlobalEventHandlers.onpause,
  //   IGlobalEventHandlers.onplay,
  //   IGlobalEventHandlers.onplaying,
  //   IGlobalEventHandlers.onpointercancel,
  //   IGlobalEventHandlers.onpointerdown,
  //   IGlobalEventHandlers.onpointerenter,
  //   IGlobalEventHandlers.onpointerleave,
  //   IGlobalEventHandlers.onpointermove,
  //   IGlobalEventHandlers.onpointerout,
  //   IGlobalEventHandlers.onpointerover,
  //   IGlobalEventHandlers.onpointerup,
  //   IGlobalEventHandlers.onprogress,
  //   IGlobalEventHandlers.onratechange,
  //   IGlobalEventHandlers.onreset,
  //   IGlobalEventHandlers.onresize,
  //   IGlobalEventHandlers.onscroll,
  //   IGlobalEventHandlers.onsecuritypolicyviolation,
  //   IGlobalEventHandlers.onseeked,
  //   IGlobalEventHandlers.onseeking,
  //   IGlobalEventHandlers.onselect,
  //   IGlobalEventHandlers.onselectionchange,
  //   IGlobalEventHandlers.onselectstart,
  //   IGlobalEventHandlers.onslotchange,
  //   IGlobalEventHandlers.onstalled,
  //   IGlobalEventHandlers.onsubmit,
  //   IGlobalEventHandlers.onsuspend,
  //   IGlobalEventHandlers.ontimeupdate,
  //   IGlobalEventHandlers.ontoggle,
  //   IGlobalEventHandlers.ontouchcancel,
  //   IGlobalEventHandlers.ontouchend,
  //   IGlobalEventHandlers.ontouchmove,
  //   IGlobalEventHandlers.ontouchstart,
  //   IGlobalEventHandlers.ontransitioncancel,
  //   IGlobalEventHandlers.ontransitionend,
  //   IGlobalEventHandlers.ontransitionrun,
  //   IGlobalEventHandlers.ontransitionstart,
  //   IGlobalEventHandlers.onvolumechange,
  //   IGlobalEventHandlers.onwaiting,
  //   IGlobalEventHandlers.onwebkitanimationend,
  //   IGlobalEventHandlers.onwebkitanimationiteration,
  //   IGlobalEventHandlers.onwebkitanimationstart,
  //   IGlobalEventHandlers.onwebkittransitionend,
  //   IGlobalEventHandlers.onwheel,
  //   IGlobalEventHandlers.onafterprint,
  //   IGlobalEventHandlers.onbeforeprint,
  //   IGlobalEventHandlers.onbeforeunload,
  //   IGlobalEventHandlers.ongamepadconnected,
  //   IGlobalEventHandlers.ongamepaddisconnected,
  //   IGlobalEventHandlers.onhashchange,
  //   IGlobalEventHandlers.onlanguagechange,
  //   IGlobalEventHandlers.onmessage,
  //   IGlobalEventHandlers.onmessageerror,
  //   IGlobalEventHandlers.onoffline,
  //   IGlobalEventHandlers.ononline,
  //   IGlobalEventHandlers.onpagehide,
  //   IGlobalEventHandlers.onpageshow,
  //   IGlobalEventHandlers.onpopstate,
  //   IGlobalEventHandlers.onrejectionhandled,
  //   IGlobalEventHandlers.onstorage,
  //   IGlobalEventHandlers.onunhandledrejection,
  //   IGlobalEventHandlers.onunload,
  // ]) {
  //   const eventName = /on(.*)/.exec(eventHandler.name)?.[1];
  //   if (eventName != null) {
  //     eventHandler.setter.onArgsObserverAdd(function (this, handler) {
  //       if (this instanceof HTMLElement) {
  //         const attribute = eventHandlerTrackerAttribute(eventName);
  //         if (!!handler) {
  //           if (TrackedEvents.has(eventName)) {
  //             if (!ignoreInteractiveElement(this)) {
  //               this.setAttribute(attribute, '1');
  //             }
  //           }
  //         } else {
  //           this.removeAttribute(attribute);
  //         }
  //       }
  //     });
  //   }
  // }

  installHandlers = () => { }; // Done doing stuff!
}

export function isTrackedEvent(eventName: UIEventConfig['eventName'] | string): boolean {
  return UIEventNames.has(eventName);
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
  readonly source: 'innerText' | 'aria-label' | 'aria-labelledby' | 'aria-description' | 'aria-describedby' | 'label';
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

export type ALElementTextOptions = Types.Options<
  {
    maxDepth?: number;
    updateText?: <T extends ALElementText>(elementText: T, domSource: ALDOMTextSource) => void;
    getText?: <T extends ALElementText>(elementTexts: T[]) => ALElementText;
  }
>;

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
     * In some case, there might be just a label with a 'for' attribute that describes the label of an input element.
     * In these cases, only label points to the input, and not vice versa.
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#for
     * If we find such a label, we won't need to check the inner text anymore.
     */
    if (element.id) {
      try {
        const labels = document.querySelectorAll<HTMLLabelElement>(`label[for='${element.id}']`);
        if (labels.length > 0) {
          for (let i = 0, len = labels.length; i < len; ++i) {
            const label = labels[i];
            getTextFromInnerText({ element: label, surface }, 'label', results);
          }
          return;
        }
      } catch { }
    }
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

export function getElementTextEvent(
  element: HTMLElement | null,
  surface: string | null,
  // Event name to utilize when attempting to resolve text from a parent interactable
  // Some interactable elements may have no text to extract, in those cases we want to move up the tree to attempt from parent interactable.
  tryInteractableParentEventName?: UIEventConfig['eventName'] | null
): ALElementTextEvent {
  if (!element) {
    return {
      elementName: null,
      elementText: null,
    }
  }
  const results: ALElementText[] = [];
  getElementName(element, surface, results);

  /**
 * If we didn't look for interactable element and text is empty, we might have landed on some
 * sort of input element or a sub component of a compsite component. So, we can now go up the tree
 * to find the interactable element and then look into that sub-tree for text.
 */
  if (results.length === 0 && tryInteractableParentEventName) {
    const parentInteractable = getInteractable(
      element.parentElement,
      tryInteractableParentEventName,
      true,
      // Limit to elements with installed handlers for interactiveness check.
      true
    );
    if (parentInteractable) {
      getElementName(parentInteractable, surface, results);
    }
  }

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
