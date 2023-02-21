/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { Hook } from "@hyperion/hook";
// import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
import * as intercept from "@hyperion/hyperion-core/src/intercept";
import { assert } from "@hyperion/global";

type NetworkRequestInfo = {
  readonly body?: RequestInit['body'],
  readonly method: string;
  readonly url: string;
}

/**
 * This is a generic event to be fired when a network request is about to happen.
 * Generally, various network api can be intercepted to provide a more unified way
 * of notifying the app about network requests.
 */
export const onNetworkRequestSend = new Hook<(request: XMLHttpRequest, requestInfo: NetworkRequestInfo) => void>();

/**
 * This is a generic event to be fired when a network request has completed,
 * whether successfully or unsuccessfully.
 */
export const onNetworkRequestLoad = new Hook<(request: XMLHttpRequest) => void>();

// IWindow.fetch.onArgsObserverAdd((resource, options) => {
//   let requestInfo: NetworkRequestInfo;
//   if (resource instanceof Request) {
//     requestInfo = {
//       body: resource.body,
//       method: resource.method,
//       url: resource.url,
//     }
//   } else {
//     const url = (typeof resource === "string")
//       ? resource
//       : resource.toString();
//     requestInfo = {
//       body: options?.body,
//       method: options?.method ?? "get",
//       url,
//     }
//   }

//   onNetworkRequestSend.call(resource, requestInfo);
// });

//#region XHR
const XHR_REQUEST_INFO_PROP = 'requestInfo';
IXMLHttpRequest.open.onArgsObserverAdd(function (this, method, url) {
  intercept.setVirtualPropertyValue<NetworkRequestInfo>(
    this,
    XHR_REQUEST_INFO_PROP,
    {
      method,
      url: url instanceof URL
        ? url.href
        : url,
   });
});

IXMLHttpRequest.send.onArgsObserverAdd(function (this, body) {
  this.addEventListener('loadend', (event) => {
    if (event.target instanceof XMLHttpRequest) {
      onNetworkRequestLoad.call(event.target);
    }
  });

  const requestInfo = intercept.getVirtualPropertyValue<NetworkRequestInfo>(this, XHR_REQUEST_INFO_PROP);
  // assert ensures requestInfo is not undefined
  assert(requestInfo != null, `Unexpected situation! Request info is missing from xhr object`);
  onNetworkRequestSend.call(
    this,
    (body instanceof Document) ? requestInfo : {...requestInfo, body},
  );
});
//#endregion

//TODO: do we care about sendBeacon as well?
