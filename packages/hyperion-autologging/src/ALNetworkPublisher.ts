/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { Channel } from "@hyperion/hook/src/Channel";
import * as IPromise from "@hyperion/hyperion-core/src/IPromise";
import * as intercept from "@hyperion/hyperion-core/src/intercept";
import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
import { getTriggerFlowlet, setTriggerFlowlet } from "@hyperion/hyperion-flowlet/src/TriggerFlowlet";
import * as Types from "@hyperion/hyperion-util/src/Types";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import * as ALEventIndex from "./ALEventIndex";
import { ALLoggableEvent, ALOptionalFlowletEvent, ALSharedInitOptions } from "./ALType";

type ALNetworkEvent = ALLoggableEvent & ALOptionalFlowletEvent & Readonly<{
  event: "network";
  initiatorType: "fetch" | "xmlhttprequest"; // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/initiatorType
}>;


/**
 * This is a generic event to be fired when a network request is about to happen.
 * Generally, various network api can be intercepted to provide a more unified way
 * of notifying the app about network requests.
 */
type RequestInfo = {
  method: string;
  url: string;
  uri: URL;
  body?: RequestInit['body'],
}
export type ALNetworkRequestEvent = ALNetworkEvent & Readonly<RequestInfo>;

export type ALNetworkResponseEvent = ALNetworkEvent & Readonly<
  {
    requestEvent: ALNetworkRequestEvent;
  }
  &
  (
    {
      initiatorType: "fetch";
      response: Response;
    }
    |
    {
      initiatorType: "xmlhttprequest";
      response: XMLHttpRequest;
    }
  )
>;

export type ALChannelNetworkEvent = Readonly<{
  al_network_request: [ALNetworkRequestEvent];
  al_network_response: [ALNetworkResponseEvent];
}>;


type ALChannel = Channel<ALChannelNetworkEvent>;

export type InitOptions = Types.Options<
  ALSharedInitOptions &
  {
    channel: ALChannel;
    /**
     * if provided, only requests that pass the filter function
     * will generate request/response events.
     */
    requestFilter?: (request: RequestInfo) => boolean;

    /**
     * If passed, it will enable the app to mark any desired request with
     * extra information (e.g. flowlet)
     */
    requestUrlMarker?: (request: Omit<RequestInfo, 'uri'>, params: URLSearchParams) => void;
  }
>;
function parseToURL(url: string): URL {
  return new URL(url, "http://undefined");
}

function urlAppendParam(url: string, params: URLSearchParams): string {
  // Note that it is not easy to use URL since we don't quite know the base of relative urls
  const separator = url.indexOf("?") !== -1 ? "&" : "?";
  const rawParams = decodeURIComponent(params.toString()); // Which one do we prefer?
  return `${url}${separator}${rawParams}`;
}
const REQUEST_INFO_PROP_NAME = 'requestInfo';

export function getFetchRequestInfo(...args: Parameters<Window['fetch']>): RequestInfo {
  const [input, init] = args;
  let request: RequestInfo;
  if (typeof input === "string") {
    request = {
      body: init?.body,
      method: init?.method ?? "GET",
      url: input,
      uri: parseToURL(input),
    };
  } else if (input instanceof Request) {
    request = {
      body: input.body,
      method: input.method,
      url: input.url,
      uri: parseToURL(input.url),
    };

  } else {
    request = {
      method: "GET",
      url: input.href,
      uri: input,
    };
  }
  return request;
}

function captureFetch(options: InitOptions): void {
  const { channel, flowletManager, requestUrlMarker } = options;

  if (requestUrlMarker) {
    /**
     * Note that args mapper runs before args observer, so the following
     * changes will be picked up by the next observers, which is what we want
     */
    IWindow.fetch.onBeforeCallMapperAdd(args => {
      const urlParams = new URLSearchParams();

      let input = args[0];
      if (typeof input === "string") {
        const init = args[1];
        requestUrlMarker(
          {
            method: init?.method ?? "GET",
            url: input
          },
          urlParams
        );
        args[0] = urlAppendParam(input, urlParams);
      } else if (input instanceof Request) {
        requestUrlMarker(input, urlParams)
        args[0] = new Request(
          urlAppendParam(input.url, urlParams),
          {
            credentials: input.credentials,
            headers: input.headers,
            integrity: input.integrity,
            keepalive: input.keepalive,
            method: input.method,
            mode: input.mode,
            redirect: input.redirect,
            referrer: input.referrer,
            referrerPolicy: input.referrerPolicy,
            signal: input.signal,
          }
        );
      }

      return args;
    });
  }

  IWindow.fetch.onBeforeAndAfterCallMapperAdd(([input, init]) => {
    let ephemeralRequestEvent: ALNetworkResponseEvent['requestEvent'] | null;
    let request: RequestInfo = getFetchRequestInfo(input, init);

    if (!options.requestFilter || options.requestFilter(request)) {
      const flowlet = flowletManager.top();
      channel.emit("al_network_request", ephemeralRequestEvent = {
        initiatorType: "fetch",
        event: "network",
        eventTimestamp: performanceAbsoluteNow(),
        eventIndex: ALEventIndex.getNextEventIndex(),
        flowlet,
        triggerFlowlet: flowlet?.data.triggerFlowlet,
        ...request,
        metadata: {},
      });
    } else {
      ephemeralRequestEvent = null;
    }

    const parentTriggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
    const triggerFlowlet = new flowletManager.flowletCtor(`fetch(method=${request.method}&url=${request.uri.pathname})`, parentTriggerFlowlet);

    return value => {
      setTriggerFlowlet(value, triggerFlowlet); // This will be picked by the wrappers of Promis.* callbacks.

      /**
       * There might be many parallel fetch requests happening together.
       * The argsObserver and valueObserver happen immediately before/after
       * the same fetch call. So, we make a copy of requestEvent into the
       * Promise value itself to ensure each call gets its own instance.
       */

      if (ephemeralRequestEvent) {
        intercept.intercept(value, IPromise.IPromisePrototype); // Ensure we can setVirtualPropertyValue, and ensures Promise is intercepted.
        intercept.setVirtualPropertyValue<ALNetworkRequestEvent>(value, REQUEST_INFO_PROP_NAME, ephemeralRequestEvent);
        value.then(response => {
          const requestEvent = intercept.getVirtualPropertyValue<ALNetworkRequestEvent>(value, REQUEST_INFO_PROP_NAME);
          assert(requestEvent != null, `Unexpected situation! Request info missing from fetch promise object`);
          const flowlet = requestEvent?.flowlet; // Reuse the same flowlet as request, since by now things have changed.

          // const triggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
          assert(triggerFlowlet === flowletManager.top()?.data.triggerFlowlet, `Broken trigger flowlet chain!`);

          channel.emit('al_network_response', {
            initiatorType: "fetch",
            event: "network",
            eventTimestamp: performanceAbsoluteNow(),
            eventIndex: ALEventIndex.getNextEventIndex(),
            flowlet,
            triggerFlowlet,
            requestEvent,
            response,
            metadata: {},
          });
        });
      }
      return value;
    }
  });
}

function captureXHR(options: InitOptions): void {
  const { channel, flowletManager, requestUrlMarker } = options;

  if (requestUrlMarker) {
    /**
     * Note that args mapper runs before args observer, so the following
     * changes will be picked up by the next observers, which is what we want
     */
    IXMLHttpRequest.open.onBeforeCallMapperAdd(args => {
      const urlParams = new URLSearchParams();

      const [method, url] = args;

      if (typeof url === "string") {
        requestUrlMarker({ method, url }, urlParams);
        args[1] = urlAppendParam(url, urlParams);
      } else if (url instanceof URL) {
        requestUrlMarker({ method, url: url.href }, url.searchParams);
      }

      return args;
    });
  }

  IXMLHttpRequest.open.onBeforeCallObserverAdd(function (this, method, url) {
    const request: RequestInfo = typeof url === 'string'
      ? {
        method,
        url,
        uri: parseToURL(url)
      }
      : {
        method,
        url: url.href,
        uri: url
      };
    intercept.setVirtualPropertyValue<RequestInfo>(
      this,
      REQUEST_INFO_PROP_NAME,
      request,
    );

    const parentTriggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
    const triggerFlowlet = new flowletManager.flowletCtor(`xhr(method=${method}&url=${request.uri.pathname})`, parentTriggerFlowlet);
    setTriggerFlowlet(this, triggerFlowlet);
  });

  /**
   * We could use something like the following to catch every event listener on the xhr
   * however, this means we would slowdown every such call just to check if the `this`
   * argument is an XHR.
   * Instead, we just add the very first event handler ourselves to make sure the event
   * would carry the right info.
   * This approach is similar to how for UI events we rely on being the first event handler
   * for them to update the Event object's triggerFlowlet.
    // IEventTarget.addEventListener.onArgsObserverAdd(function (this, _event, callback) {
    //   if (this instanceof XMLHttpRequest) {
    //     const triggerFlowlet = getTriggerFlowlet(this);
    //     if (triggerFlowlet) {
    //       ...
    //     }
    //   }
    // });
   */
  if (__DEV__) {
    IXMLHttpRequest.constructor.onAfterCallObserverAdd(xhr => {
      [
        "abort",
        "error",
        "load",
        "loadend",
        "loadstart",
        "progress",
        "readystatechange",
        "timeout",
      ].forEach(eventName => {
        xhr.addEventListener(eventName, event => {
          const triggerFlowlet = getTriggerFlowlet(xhr);
          const topTriggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
          const eventTriggerFlowlet = getTriggerFlowlet(event.target);
          assert(triggerFlowlet != null, `Expected triggerFlowlet to be assigned to xhr`);
          assert(triggerFlowlet === topTriggerFlowlet, `Expected triggerFlowlet to be on the stack!`);
          assert(triggerFlowlet === eventTriggerFlowlet, `Expected triggerFlowlet to be on the event.target!`);
          // if (triggerFlowlet) {
          //   setTriggerFlowlet(event, triggerFlowlet);
          // }
        });
      });
    });
  }

  IXMLHttpRequest.send.onBeforeCallObserverAdd(function (this, body) {
    const requestRaw = intercept.getVirtualPropertyValue<RequestInfo>(this, REQUEST_INFO_PROP_NAME);
    assert(requestRaw != null, `Unexpected situation! Request info is missing from xhr object`);
    const request = body instanceof Document ? requestRaw : {
      ...requestRaw,
      body
    };


    const flowlet = flowletManager.top(); // Before calling requestFilter and losing current top flowlet
    const triggerFlowlet = getTriggerFlowlet(this);

    if (!options.requestFilter || options.requestFilter(request)) {
      let requestEvent: ALNetworkResponseEvent['requestEvent'];

      channel.emit("al_network_request", requestEvent = {
        initiatorType: "xmlhttprequest",
        event: "network",
        eventTimestamp: performanceAbsoluteNow(),
        eventIndex: ALEventIndex.getNextEventIndex(),
        flowlet,
        triggerFlowlet,
        ...request, // assert already ensures request is not undefined
        metadata: {},
      });

      this.addEventListener(
        'loadend',
        event => {
          assert(event.target === this, "Invalid xhr target for loadend event");
          assert(triggerFlowlet === flowletManager.top()?.data.triggerFlowlet, "top trigger flowlet on the stack not set correctly!");
          channel.emit('al_network_response', {
            initiatorType: "xmlhttprequest",
            event: "network",
            eventTimestamp: performanceAbsoluteNow(),
            eventIndex: ALEventIndex.getNextEventIndex(),
            flowlet, // should carry request flowlet forward
            triggerFlowlet, //should carry request triggerFlowlet forward as the main trigger
            requestEvent,
            response: this,
            metadata: {},
          });
        },
        { once: true }
      );
    }
  });

}

function captureSendBeacon(_options: InitOptions): void {
  //TODO: do we care about sendBeacon as well?
}

export function publish(options: InitOptions): void {
  captureFetch(options);
  captureXHR(options);
  captureSendBeacon(options);
}
