/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "@hyperion/global";
import { Channel } from "@hyperion/hook/src/Channel";
import * as intercept from "@hyperion/hyperion-core/src/intercept";
import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
import performanceAbsoluteNow from "@hyperion/hyperion-util/src/performanceAbsoluteNow";
import * as Types from "@hyperion/hyperion-util/src/Types";
import { ALFlowletEvent, ALSharedInitOptions, ALTimedEvent } from "./ALType";

type ALNetworkEvent = ALTimedEvent & Readonly<{
  event: "network";
  initiatorType: "fetch" | "xmlhttprequest"; // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/initiatorType
  flowlet: ALFlowletEvent['flowlet'] | null;
}>;


/**
 * This is a generic event to be fired when a network request is about to happen.
 * Generally, various network api can be intercepted to provide a more unified way
 * of notifying the app about network requests.
 */
type RequestInfo = {
  method: string;
  url: string | URL; // TODO: should we always send on of the types?
  body?: RequestInit['body'],
}
export type ALNetworkRequestEvent = ALNetworkEvent & Readonly<RequestInfo>;

export type ALNetworkResponseEvent = ALNetworkEvent & Readonly<
  {
    requestEvent: ALNetworkRequestEvent | undefined | null;
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
  }
>;


function captureFetch(options: InitOptions): void {
  const { channel, flowletManager } = options;

  let requestEvent: ALNetworkResponseEvent['requestEvent'];
  IWindow.fetch.onArgsObserverAdd((input, init) => {
    let request: RequestInfo;
    if (typeof input === "string") {
      request = {
        body: init?.body,
        method: init?.method ?? "GET",
        url: input,
      };
    } else if (input instanceof Request) {
      request = {
        body: input.body,
        method: input.method,
        url: input.url,
      };

    } else {
      request = {
        method: "GET",
        url: input,
      };
    }

    if (!options.requestFilter || options.requestFilter(request)) {
      channel.emit("al_network_request", requestEvent = {
        initiatorType: "fetch",
        event: "network",
        eventTimestamp: performanceAbsoluteNow(),
        flowlet: flowletManager.top(),
        ...request,
      });
    } else {
      requestEvent = null;
    }
  });

  IWindow.fetch.onValueObserverAdd(value => {
    /**
     * There might be many parallel fetch requests happening together.
     * The argsObserver and valueObserver happen immediately before/after 
     * the same fetch call. So, we make a copy of requestEvent here to 
     * ensure each call gets its own instance.
     */
    const request = requestEvent;
    if (request !== null) {
      value.then(response => {
        channel.emit('al_network_response', {
          initiatorType: "fetch",
          event: "network",
          eventTimestamp: performanceAbsoluteNow(),
          flowlet: flowletManager.top(),
          requestEvent,
          response,
        });
      });
    }
  });
}

const XHR_REQUEST_INFO_PROP = 'requestInfo';
function captureXHR(options: InitOptions): void {
  const { channel, flowletManager } = options;

  IXMLHttpRequest.open.onArgsObserverAdd(function (this, method, url) {
    intercept.setVirtualPropertyValue<RequestInfo>(this, XHR_REQUEST_INFO_PROP, { method, url });
  });

  IXMLHttpRequest.send.onArgsObserverAdd(function (this, body) {
    const requestRaw = intercept.getVirtualPropertyValue<RequestInfo>(this, XHR_REQUEST_INFO_PROP);
    assert(requestRaw != null, `Unexpected situation! Request info is missing from xhr object`);
    const request = body instanceof Document ? requestRaw : {
      ...requestRaw,
      body
    };

    let requestEvent: ALNetworkResponseEvent['requestEvent'];

    if (!options.requestFilter || options.requestFilter(request)) {
      channel.emit("al_network_request", requestEvent = {
        initiatorType: "xmlhttprequest",
        event: "network",
        eventTimestamp: performanceAbsoluteNow(),
        flowlet: flowletManager.top(),
        ...request // assert already ensures request is not undefined
      });

      this.addEventListener(
        'loadend',
        event => {
          assert(event.target === this, "Invalid xhr target for loadend event");

          channel.emit('al_network_response', {
            initiatorType: "xmlhttprequest",
            event: "network",
            eventTimestamp: performanceAbsoluteNow(),
            flowlet: flowletManager.top(),
            requestEvent,
            response: this,
          })
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
