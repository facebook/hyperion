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

const EventHandlerTrackerAttribute = `data-interactable`;


export function getInteractable(
  node: EventTarget | null,
  eventName: UIEventConfig['eventName'],
  // Whether to require an actual handler is assigned to determine interactiveness, rather than including "interactive" element tags
  requireHandlerAssigned: boolean = false,
): HTMLElement | null {
  // https://www.w3.org/TR/2011/WD-html5-20110525/interactive-elements.html
  const selectorString = `[${EventHandlerTrackerAttribute}*="${eventName}"]${requireHandlerAssigned ? '' : ',input,button,select,option,details,dialog,summary,a[href]'}`;
  if (node instanceof HTMLElement) {
    for (let element: HTMLElement | null = node; element != null; element = element.parentElement) {
      if (element.matches(selectorString) || elementHasEventHandler(element, eventName as HTMLElementEventNames)) {
        if (ignoreInteractiveElement(element)) {
          continue;
        }
        return element;
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

  const eventNameToken = (eventName: string) => `|${eventName}|`;
  function addEventNameToList(eventName: string, current: string | null): string {
    const pattern = eventNameToken(eventName);
    if (current) {
      if (current.includes(pattern)) {
        return current;
      } else {
        return current + pattern;
      }
    }
    return pattern;
  }
  function removeEventNameFromList(eventName: string, current: string | null): string | null | undefined {
    const pattern = eventNameToken(eventName);
    return current?.replace(pattern, "");
  }

  IEventTarget.addEventListener.onBeforeCallObserverAdd(function (
    this: EventTarget,
    event,
    _listener,
  ) {
    if (UIEventNames.has(event) && this instanceof HTMLElement && !ignoreInteractiveElement(this)) {
      this.setAttribute(EventHandlerTrackerAttribute, addEventNameToList(event, this.getAttribute(EventHandlerTrackerAttribute)));
    }
  });

  IEventTarget.removeEventListener.onBeforeCallObserverAdd(function (
    this: EventTarget,
    event,
    _listener,
  ) {
    if (this instanceof HTMLElement) {
      const newValue = removeEventNameFromList(event, this.getAttribute(EventHandlerTrackerAttribute));
      if (newValue) {
        this.setAttribute(EventHandlerTrackerAttribute, newValue);
      } else {
        this.removeAttribute(EventHandlerTrackerAttribute);
      }
    }
  });

  IReactComponent.onReactDOMElement.add((_component, props: ReactComponentObjectProps) => {
    if (props != null) {
      let currentValue = props[EventHandlerTrackerAttribute];
      UIEventNames.forEach(event => {
        if (props[SYNTHETIC_EVENT_HANDLER_MAP[event]] != null) {
          currentValue = addEventNameToList(event, currentValue);
        }
      });
      if (currentValue) {
        props[EventHandlerTrackerAttribute] = currentValue;
      }
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
    enableElementTextCache?: boolean;
  }
>;

type CachedALElementResults = {
  surface: string | null;
  result: ALElementTextEvent;
}

let _options: ALElementTextOptions | null = null;
let MaxDepth = 20;
let ElementTextCache: WeakMap<HTMLElement, CachedALElementResults> | null = null;
export function init(options: ALElementTextOptions) {
  _options = options;
  MaxDepth = _options.maxDepth ?? MaxDepth;
  if (options.enableElementTextCache) {
    ElementTextCache = new WeakMap<HTMLElement, CachedALElementResults>();
  }
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

function getTextFromTextNode(domSource: ALDOMTextSource, textNode: Text, source: ALElementText['source'], results: ALElementText[]): ALElementText[] | null {
  const text = textNode.nodeValue;
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


// Takes a space-delimited list of DOM element IDs and returns the inner text of those elements joined by spaces
function getTextFromElementsByIds(domSource: ALDOMTextSource, source: ALElementText['source'], results: ALElementText[]): ALElementText[] | null {
  /**
   * Check the descrtion of https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby#benefits_and_drawbacks
   * we need to drop repeated attributes and ensure there is a space between the values
   */
  const indirectSources = domSource.element
    .getAttribute(source)
    ?.split(' ')
    .filter((id, index, array) => array.indexOf(id) === index)
    .map(id => document.getElementById(id))
    .filter(function (element): element is HTMLElement { return element instanceof HTMLElement });
  if (!indirectSources?.length) {
    return null;
  }

  for (let i = 0; i < indirectSources.length; i++) {
    if (i) {
      results.push({ text: " ", source }); // Insert space between values
    }

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
  /**
   * We want to allow an external text processor to see each text node separately and also report the full text
   * as its parts in case applications want to use translation services or compare agains known databases.
   * So, instead of directly calling .textContent or .innerText, we use the explicit walking of the dom sub-tree
   */
  const { element, surface } = domSource;
  for (
    let child = element.firstChild; child; child = child.nextSibling) {
    if (child instanceof HTMLElement && child.nodeType === Node.ELEMENT_NODE) {
      getTextFromInnerText({ element: child, surface }, source, results);
    } else if (child instanceof Text && child.nodeType === Node.TEXT_NODE) {
      getTextFromTextNode({ element, surface }, child, source, results);
    }
  }

  /**
   * The following is an alternative implementation and may not be identical to above.
   * Specially handling of whitespaces may be different.
   * Keeping the code here for reference and bringing back if needed later.
   */
  // const text = domSource.element.textContent; // Jest does not support innerText, https://github.com/jsdom/jsdom/issues/1245
  // if (text != null && text !== '') {
  //   return callExternalTextProcessor(
  //     {
  //       text,
  //       source
  //     },
  //     domSource,
  //     results
  //   );
  // }
  return null;
}

// Some environments (like JEST) may not have CSS
export const cssEscape = typeof window.CSS?.escape === 'function'
  ? (str: string) => window.CSS.escape(str)
  : (str: string) => str.replace(/['"\[\]\(\)]/g, m => {
    return "\\" + m;
  });

//https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories#labelable
const LabelableElememts = /BUTTON|INPUT|METER|OUTPUT|PROGRESS|SELECT|TEXTAREA/;
function getTextFromElementLabel(domSource: ALDOMTextSource, source: 'label', results: ALElementText[]): ALElementText[] | null {
  const { element, surface } = domSource;

  // Many labelable elements could have a label assigned to them a few possible ways
  const labels = (element as { readonly labels?: NodeListOf<HTMLLabelElement>; }).labels;
  if (labels && labels.length) {
    for (let i = 0, len = labels.length; i < len; ++i) {
      const label = labels[i];
      getTextFromInnerText({ element: label, surface }, source, results);
    }
    return results;
  }

  if (!LabelableElememts.test(element.nodeName)) {
    return null; // The rest of the logic is not applicable
  }

  //https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#:~:text=Alternatively%2C%20you%20can%20nest%20the%20%3Cinput%3E%20directly%20inside%20the%20%3Clabel%3E
  if (element.parentElement instanceof HTMLLabelElement) {
    getTextFromInnerText({ element: element.parentElement, surface }, source, results);
    return results;
  }

  /**
    * If the element.labels is not assigned we can do a last best effort.
    * In some case, there might be just a label with a 'for' attribute that describes the label of an input element.
    * In these cases, only label points to the input, and not vice versa.
    * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#for
    * If we find such a label, we won't need to check the inner text anymore.
    */
  if (element.id) {
    try {
      // escape characters that may break the syntax of CSS selector
      const sanitizedId = cssEscape(element.id)
      const labels = document.querySelectorAll<HTMLLabelElement>(`label[for='${sanitizedId}']`);
      if (labels.length > 0) {
        for (let i = 0, len = labels.length; i < len; ++i) {
          const label = labels[i];
          getTextFromInnerText({ element: label, surface }, source, results);
        }
        return results;
      }
    } catch { }
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
   * Note that according to standard:
   * -- the aria-labeledby has precedence over everything, https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby#:~:text=takes%20precedence%20over%20all%20other%20methods%20of%20providing%20an%20accessible%20name%2C%20including%20aria%2Dlabel%2C%20%3Clabel%3E%2C%20and%20the%20element%27s%20inner%20text
   * -- the aria-label has precedence over <label> https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label#:~:text=the%20input%27s%20%3Clabel%3E%20text%20as%20the%20accessible%20name%20for%20that%20element
   * However, since the visible text on the screen is the most likley thing to be search for, we start from <label>
   */
  const selfText =
    getTextFromElementLabel(domSource, 'label', results)
    ?? getTextFromElementsByIds(domSource, 'aria-labelledby', results)
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
        getTextFromTextNode({ element: element, surface }, child, 'innerText', results);
      }
    }
  }

}

export function getElementTextEvent(
  element: HTMLElement | null,
  surface: string | null,
  // Event name to utilize when attempting to resolve text from a parent interactable
  // Some interactable elements may have no text to extract, in those cases we want to move up the tree to attempt from parent interactable.
  tryInteractableParentEventName?: UIEventConfig['eventName'] | null,
  useCachedElementText?: boolean
): ALElementTextEvent {
  if (!element) {
    return {
      elementName: null,
      elementText: null,
    }
  }

  if (useCachedElementText) {
    const cached = ElementTextCache?.get(element);
    if (cached && cached.surface === surface) {
      return cached.result;
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
  const finalResult: ALElementTextEvent = {
    elementName: elementText?.text ?? null,
    elementText,
  };

  // even if skipCache is set, we update the cache, this way, certain events can be used to keep the cache uptodate
  ElementTextCache?.set(element, {
    surface,
    result: finalResult,
  })

  return finalResult;
}
