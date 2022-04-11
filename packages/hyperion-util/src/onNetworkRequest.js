/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { Hook } from "@hyperion/hook";
import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
import * as intercept from "@hyperion/hyperion-core/src/intercept";
import { assert } from "@hyperion/global";
/**
 * This is a generic event to be fired when a network request is about to happen.
 * Generally, various network api can be intercepted to provide a more unified way
 * of notifying the app about network requests.
 */
export const onNetworkRequest = new Hook();
IWindow.fetch.onArgsObserverAdd((input, init) => {
    let request;
    if (typeof input === "string") {
        request = {
            method: init?.method ?? "get",
            url: input,
        };
    }
    else {
        request = {
            method: input.method,
            url: input.url,
        };
    }
    onNetworkRequest.call(request);
});
//#region XHR
const XHR_REQUEST_INFO_PROP = 'requestInfo';
IXMLHttpRequest.open.onArgsObserverAdd(function (method, url) {
    intercept.setVirtualPropertyValue(this, XHR_REQUEST_INFO_PROP, { method, url });
});
IXMLHttpRequest.send.onArgsObserverAdd(function (_body) {
    const request = intercept.getVirtualPropertyValue(this, XHR_REQUEST_INFO_PROP);
    assert(request != null, `Unexpected situation! Request info is missing from xhr object`);
    onNetworkRequest.call(request); // assert already ensures request is not undefined
});
//#endregion
//TODO: do we care about sendBeacon as well? 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25OZXR3b3JrUmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9uTmV0d29ya1JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEMsT0FBTyxLQUFLLE9BQU8sTUFBTSxvQ0FBb0MsQ0FBQztBQUM5RCxPQUFPLEtBQUssZUFBZSxNQUFNLDRDQUE0QyxDQUFDO0FBQzlFLE9BQU8sS0FBSyxTQUFTLE1BQU0sdUNBQXVDLENBQUM7QUFDbkUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBTzFDOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLElBQUksRUFBcUMsQ0FBQztBQUU5RSxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO0lBQzlDLElBQUksT0FBdUIsQ0FBQztJQUM1QixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUM3QixPQUFPLEdBQUc7WUFDUixNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sSUFBSSxLQUFLO1lBQzdCLEdBQUcsRUFBRSxLQUFLO1NBQ1gsQ0FBQztLQUNIO1NBQU07UUFDTCxPQUFPLEdBQUc7WUFDUixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07WUFDcEIsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO1NBQ2YsQ0FBQTtLQUNGO0lBRUQsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBRUgsYUFBYTtBQUNiLE1BQU0scUJBQXFCLEdBQUcsYUFBYSxDQUFDO0FBQzVDLGVBQWUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsTUFBTSxFQUFFLEdBQUc7SUFDaEUsU0FBUyxDQUFDLHVCQUF1QixDQUFpQixJQUFJLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUNsRyxDQUFDLENBQUMsQ0FBQztBQUVILGVBQWUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBZ0IsS0FBSztJQUMxRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsdUJBQXVCLENBQWlCLElBQUksRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBQy9GLE1BQU0sQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFFLCtEQUErRCxDQUFDLENBQUM7SUFDekYsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsa0RBQWtEO0FBQ3BGLENBQUMsQ0FBQyxDQUFDO0FBQ0gsWUFBWTtBQUVaLDZDQUE2QyJ9