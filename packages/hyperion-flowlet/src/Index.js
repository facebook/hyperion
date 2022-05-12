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
// import * as IWorker from "@hyperion/hyperion-dom/src/IWorker";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
export function initFlowletTrackers(flowletManager) {
    const IS_SETUP_PROP_NAME = `__isSetup`;
    function wrap(listener) {
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
            funcInterceptor.onArgsObserverAdd(() => {
                flowletManager.push(currentFLowlet);
            });
            funcInterceptor.onValueObserverAdd(() => {
                flowletManager.pop(currentFLowlet);
            });
            // funcInterceptor.setCustom(function (this: any) {
            //   const handler = funcInterceptor.getOriginal();
            //   if (flowletManager.top() === currentFLowlet) {
            //     return handler.apply(this, <any>arguments);
            //   }
            //   let res;
            //   try {
            //     flowletManager.push(currentFLowlet);
            //     res = handler.apply(this, <any>arguments);
            //   } finally {
            //     flowletManager.pop(currentFLowlet);
            //   }
            //   return res;
            // })
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
        // IWorker.onmessage,
        // IWorker.onmessageerror,
        // IWorker.onerror,
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
            args[0] = wrap(func);
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
            args[0] = wrap(handler);
            return args;
        });
    }
    IPromise.then.onArgsMapperAdd(args => {
        args[0] = wrap(args[0]);
        args[1] = wrap(args[1]);
        return args;
    });
    IPromise.Catch.onArgsMapperAdd(args => {
        args[0] = wrap(args[0]);
        return args;
    });
    IEventTarget.addEventListener.onArgsMapperAdd(args => {
        args[1] = wrap(args[1]);
        return args;
    });
    IEventTarget.removeEventListener.onArgsMapperAdd(args => {
        args[1] = unwrap(args[1]);
        return args;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx1Q0FBdUMsQ0FBQztBQUN0RSxPQUFPLEVBQWdCLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkNBQTJDLENBQUM7QUFDeEgsT0FBTyxLQUFLLFlBQVksTUFBTSx5Q0FBeUMsQ0FBQztBQUN4RSxPQUFPLEtBQUssb0JBQW9CLE1BQU0saURBQWlELENBQUM7QUFDeEYsT0FBTyxLQUFLLFFBQVEsTUFBTSxzQ0FBc0MsQ0FBQztBQUNqRSxPQUFPLEtBQUssT0FBTyxNQUFNLG9DQUFvQyxDQUFDO0FBQzlELE9BQU8sS0FBSyxXQUFXLE1BQU0seUNBQXlDLENBQUM7QUFDdkUsaUVBQWlFO0FBQ2pFLE9BQU8sS0FBSyxlQUFlLE1BQU0sNENBQTRDLENBQUM7QUFHOUUsTUFBTSxVQUFVLG1CQUFtQixDQUFDLGNBQThCO0lBRWhFLE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDO0lBQ3ZDLFNBQVMsSUFBSSxDQUE0QyxRQUFXO1FBQ2xFLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDYixPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUVELE1BQU0sY0FBYyxHQUFHLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM1QyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ25CLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO1FBRUQsTUFBTSxlQUFlLEdBQUcsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1lBQ3hDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUMzQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUNyQyxjQUFjLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxD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