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

export type ALNetworkResponseEvent = ALNetworkEvent & Readonly<{

}>;

export type ALChannelNetworkEvent = Readonly<{
  al_network_request: [ALNetworkRequestEvent];
  al_network_response: [ALNetworkResponseEvent];
}>;


type ALChannel = Channel<ALChannelNetworkEvent>;

export type InitOptions = Types.Options<
  ALSharedInitOptions &
  {
    channel: ALChannel;
  }
>;


function captureFetch(options: InitOptions): void {
  const { channel, flowletManager } = options;

  IWindow.fetch.onArgsObserverAdd((input, init) => {
    let request: RequestInfo;
    if (typeof input === "string") {
      request = {
        body: init?.body,
        method: init?.method ?? "get",
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

    channel.emit("al_network_request", {
      ...request,
      event: "network",
      eventTimestamp: performanceAbsoluteNow(),
      flowlet: flowletManager.top()
    });
  });
}

const XHR_REQUEST_INFO_PROP = 'requestInfo';
function captureXHR(options: InitOptions): void {
  const { channel, flowletManager } = options;

  IXMLHttpRequest.open.onArgsObserverAdd(function (this, method, url) {
    intercept.setVirtualPropertyValue<RequestInfo>(this, XHR_REQUEST_INFO_PROP, { method, url });
  });

  IXMLHttpRequest.send.onArgsObserverAdd(function (this, body) {
    const request = intercept.getVirtualPropertyValue<RequestInfo>(this, XHR_REQUEST_INFO_PROP);
    assert(request != null, `Unexpected situation! Request info is missing from xhr object`);
    channel.emit("al_network_request", {
      event: "network",
      eventTimestamp: performanceAbsoluteNow(),
      flowlet: flowletManager.top(),
      ...(body instanceof Document) ? request : { ...request, body }// assert already ensures request is not undefined
    });
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
