/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import { isIntercepted } from "@hyperion/hyperion-core/src/intercept";
import { interceptEventListener, isEventListenerObject } from "@hyperion/hyperion-dom/src/IEventListener";
import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
import * as IGlobalEventHandlers from "@hyperion/hyperion-dom/src/IGlobalEventHandlers";
import * as IPromise from "@hyperion/hyperion-core/src/IPromise";
import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IGlobalThis from "@hyperion/hyperion-core/src/IGlobalThis";
import * as IWorker from "@hyperion/hyperion-dom/src/IWorker";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
export function initFlowletTrackers(flowletManager) {
    const IS_SETUP_PROP_NAME = `__isSetup`;
    function wrap(listener, apiName) {
        if (!listener) {
            return listener;
        }
        const currentFLowlet = flowletManager.top();
        if (!currentFLowlet) {
            return listener;
        }
        const funcInterceptor = interceptEventListener(listener);
        if (!funcInterceptor[IS_SETUP_PROP_NAME]) {
            funcInterceptor[IS_SETUP_PROP_NAME] = true;
            // funcInterceptor.onArgsObserverAdd(() => {
            //   flowletManager.push(currentFLowlet);
            // });
            // funcInterceptor.onValueObserverAdd(() => {
            //   flowletManager.pop(currentFLowlet);
            // })
            funcInterceptor.setCustom(function () {
                const handler = funcInterceptor.getOriginal();
                if (flowletManager.top() === currentFLowlet) {
                    return handler.apply(this, arguments);
                }
                let res;
                let flowlet; // using this extra variable to enable .push to change the value if needed
                try {
                    flowlet = flowletManager.push(currentFLowlet, apiName);
                    res = handler.apply(this, arguments);
                }
                catch (e) {
                    console.error('callback throw', e);
                }
                finally {
                    flowletManager.pop(flowlet, apiName);
                }
                return res;
            });
        }
        return isEventListenerObject(listener) ? listener : funcInterceptor.interceptor;
    }
    function unwrap(listener) {
        if (listener && !isEventListenerObject(listener) && isIntercepted(listener)) {
            const funcInterceptor = interceptEventListener(listener);
            return funcInterceptor.getOriginal();
        }
        return listener;
    }
    for (const eventHandler of [
        IWindow.ondevicemotion,
        IWindow.ondeviceorientation,
        IWindow.onorientationchange,
        IGlobalEventHandlers.onabort,
        IGlobalEventHandlers.onanimationcancel,
        IGlobalEventHandlers.onanimationend,
        IGlobalEventHandlers.onanimationiteration,
        IGlobalEventHandlers.onanimationstart,
        IGlobalEventHandlers.onauxclick,
        IGlobalEventHandlers.onblur,
        IGlobalEventHandlers.oncanplay,
        IGlobalEventHandlers.oncanplaythrough,
        IGlobalEventHandlers.onchange,
        IGlobalEventHandlers.onclick,
        IGlobalEventHandlers.onclose,
        IGlobalEventHandlers.oncontextmenu,
        IGlobalEventHandlers.oncuechange,
        IGlobalEventHandlers.ondblclick,
        IGlobalEventHandlers.ondrag,
        IGlobalEventHandlers.ondragend,
        IGlobalEventHandlers.ondragenter,
        IGlobalEventHandlers.ondragleave,
        IGlobalEventHandlers.ondragover,
        IGlobalEventHandlers.ondragstart,
        IGlobalEventHandlers.ondrop,
        IGlobalEventHandlers.ondurationchange,
        IGlobalEventHandlers.onemptied,
        IGlobalEventHandlers.onended,
        IGlobalEventHandlers.onfocus,
        IGlobalEventHandlers.onformdata,
        IGlobalEventHandlers.ongotpointercapture,
        IGlobalEventHandlers.oninput,
        IGlobalEventHandlers.oninvalid,
        IGlobalEventHandlers.onkeydown,
        IGlobalEventHandlers.onkeypress,
        IGlobalEventHandlers.onkeyup,
        IGlobalEventHandlers.onload,
        IGlobalEventHandlers.onloadeddata,
        IGlobalEventHandlers.onloadedmetadata,
        IGlobalEventHandlers.onloadstart,
        IGlobalEventHandlers.onlostpointercapture,
        IGlobalEventHandlers.onmousedown,
        IGlobalEventHandlers.onmouseenter,
        IGlobalEventHandlers.onmouseleave,
        IGlobalEventHandlers.onmousemove,
        IGlobalEventHandlers.onmouseout,
        IGlobalEventHandlers.onmouseover,
        IGlobalEventHandlers.onmouseup,
        IGlobalEventHandlers.onpause,
        IGlobalEventHandlers.onplay,
        IGlobalEventHandlers.onplaying,
        IGlobalEventHandlers.onpointercancel,
        IGlobalEventHandlers.onpointerdown,
        IGlobalEventHandlers.onpointerenter,
        IGlobalEventHandlers.onpointerleave,
        IGlobalEventHandlers.onpointermove,
        IGlobalEventHandlers.onpointerout,
        IGlobalEventHandlers.onpointerover,
        IGlobalEventHandlers.onpointerup,
        IGlobalEventHandlers.onprogress,
        IGlobalEventHandlers.onratechange,
        IGlobalEventHandlers.onreset,
        IGlobalEventHandlers.onresize,
        IGlobalEventHandlers.onscroll,
        IGlobalEventHandlers.onsecuritypolicyviolation,
        IGlobalEventHandlers.onseeked,
        IGlobalEventHandlers.onseeking,
        IGlobalEventHandlers.onselect,
        IGlobalEventHandlers.onselectionchange,
        IGlobalEventHandlers.onselectstart,
        IGlobalEventHandlers.onslotchange,
        IGlobalEventHandlers.onstalled,
        IGlobalEventHandlers.onsubmit,
        IGlobalEventHandlers.onsuspend,
        IGlobalEventHandlers.ontimeupdate,
        IGlobalEventHandlers.ontoggle,
        IGlobalEventHandlers.ontouchcancel,
        IGlobalEventHandlers.ontouchend,
        IGlobalEventHandlers.ontouchmove,
        IGlobalEventHandlers.ontouchstart,
        IGlobalEventHandlers.ontransitioncancel,
        IGlobalEventHandlers.ontransitionend,
        IGlobalEventHandlers.ontransitionrun,
        IGlobalEventHandlers.ontransitionstart,
        IGlobalEventHandlers.onvolumechange,
        IGlobalEventHandlers.onwaiting,
        IGlobalEventHandlers.onwebkitanimationend,
        IGlobalEventHandlers.onwebkitanimationiteration,
        IGlobalEventHandlers.onwebkitanimationstart,
        IGlobalEventHandlers.onwebkittransitionend,
        IGlobalEventHandlers.onwheel,
        IGlobalEventHandlers.onafterprint,
        IGlobalEventHandlers.onbeforeprint,
        IGlobalEventHandlers.onbeforeunload,
        IGlobalEventHandlers.ongamepadconnected,
        IGlobalEventHandlers.ongamepaddisconnected,
        IGlobalEventHandlers.onhashchange,
        IGlobalEventHandlers.onlanguagechange,
        IGlobalEventHandlers.onmessage,
        IGlobalEventHandlers.onmessageerror,
        IGlobalEventHandlers.onoffline,
        IGlobalEventHandlers.ononline,
        IGlobalEventHandlers.onpagehide,
        IGlobalEventHandlers.onpageshow,
        IGlobalEventHandlers.onpopstate,
        IGlobalEventHandlers.onrejectionhandled,
        IGlobalEventHandlers.onstorage,
        IGlobalEventHandlers.onunhandledrejection,
        IGlobalEventHandlers.onunload,
        IWorker.onmessage,
        IWorker.onmessageerror,
        IWorker.onerror,
        IXMLHttpRequest.onabort,
        IXMLHttpRequest.onerror,
        IXMLHttpRequest.onload,
        IXMLHttpRequest.onloadend,
        IXMLHttpRequest.onloadstart,
        IXMLHttpRequest.onprogress,
        IXMLHttpRequest.ontimeout,
    ]) {
        eventHandler.setter.onArgsMapperAdd(function (args) {
            const func = args[0];
            args[0] = wrap(func, eventHandler.name);
            return args;
        });
    }
    for (const fi of [
        IGlobalThis.setTimeout,
        IGlobalThis.setInterval
    ]) {
        fi.onArgsMapperAdd(args => {
            let handler = args[0];
            if (typeof handler === "string") {
                handler = new Function(handler);
            }
            args[0] = wrap(handler, fi.name);
            return args;
        });
    }
    IPromise.then.onArgsMapperAdd(args => {
        args[0] = wrap(args[0], IPromise.then.name);
        args[1] = wrap(args[1], IPromise.then.name);
        return args;
    });
    IPromise.Catch.onArgsMapperAdd(args => {
        args[0] = wrap(args[0], IPromise.Catch.name);
        return args;
    });
    IEventTarget.addEventListener.onArgsMapperAdd(args => {
        args[1] = wrap(args[1], `${IEventTarget.addEventListener.name}:${args[0]}`);
        return args;
    });
    IEventTarget.removeEventListener.onArgsMapperAdd(args => {
        args[1] = unwrap(args[1]);
        return args;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx1Q0FBdUMsQ0FBQztBQUN0RSxPQUFPLEVBQWdCLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkNBQTJDLENBQUM7QUFDeEgsT0FBTyxLQUFLLFlBQVksTUFBTSx5Q0FBeUMsQ0FBQztBQUN4RSxPQUFPLEtBQUssb0JBQW9CLE1BQU0saURBQWlELENBQUM7QUFDeEYsT0FBTyxLQUFLLFFBQVEsTUFBTSxzQ0FBc0MsQ0FBQztBQUNqRSxPQUFPLEtBQUssT0FBTyxNQUFNLG9DQUFvQyxDQUFDO0FBQzlELE9BQU8sS0FBSyxXQUFXLE1BQU0seUNBQXlDLENBQUM7QUFDdkUsT0FBTyxLQUFLLE9BQU8sTUFBTSxvQ0FBb0MsQ0FBQztBQUM5RCxPQUFPLEtBQUssZUFBZSxNQUFNLDRDQUE0QyxDQUFDO0FBRzlFLE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxjQUE4QjtJQUVoRSxNQUFNLGtCQUFrQixHQUFHLFdBQVcsQ0FBQztJQUN2QyxTQUFTLElBQUksQ0FBNEMsUUFBVyxFQUFFLE9BQWU7UUFDbkYsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNiLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO1FBRUQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDbkIsT0FBTyxRQUFRLENBQUM7U0FDakI7UUFFRCxNQUFNLGVBQWUsR0FBRyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLEVBQUU7WUFDeEMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQzNDLDRDQUE0QztZQUM1Qyx5Q0FBeUM7WUFDekMsTUFBTTtZQUNO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