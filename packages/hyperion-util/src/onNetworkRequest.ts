/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";
import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
import * as intercept from "@hyperion/hyperion-core/src/intercept";
import { assert } from "@hyperion/global";

type NetworkRequest = {
  readonly method: string;
  readonly url: string | URL; // TODO: should we always send on of the types?
}

/**
 * This is a generic event to be fired when a network request is about to happen.
 * Generally, various network api can be intercepted to provide a more unified way
 * of notifying the app about network requests.
 */
export const onNetworkRequest = new Hook<(request: NetworkRequest) => void>();

IWindow.fetch.onArgsObserverAdd((input, init) => {
  let request: NetworkRequest;
  if (typeof input === "string") {
    request = {
      method: init?.method ?? "get",
      url: input,
    };
  } else {
    request = {
      method: input.method,
      url: input.url,
    }
  }

  onNetworkRequest.call(request);
});

//#region XHR
const XHR_REQUEST_INFO_PROP = 'requestInfo';
IXMLHttpRequest.open.onArgsObserverAdd(function (this, method, url) {
  intercept.setVirtualPropertyValue<NetworkRequest>(this, XHR_REQUEST_INFO_PROP, { method, url });
});

IXMLHttpRequest.send.onArgsObserverAdd(function (this, _body) {
  const request = intercept.getVirtualPropertyValue<NetworkRequest>(this, XHR_REQUEST_INFO_PROP);
  assert(request != null, `Unexpected situation! Request info is missing from xhr object`);
  onNetworkRequest.call(request); // assert already ensures request is not undefined
});
//#endregion

//TODO: do we care about sendBeacon as well? 