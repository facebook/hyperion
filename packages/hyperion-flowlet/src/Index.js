/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
import * as IGlobalThis from "@hyperion/hyperion-core/src/IGlobalThis";
import * as IPromise from "@hyperion/hyperion-core/src/IPromise";
import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
import * as IGlobalEventHandlers from "@hyperion/hyperion-dom/src/IGlobalEventHandlers";
import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IWorker from "@hyperion/hyperion-dom/src/IWorker";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
export function initFlowletTrackers(flowletManager) {
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
            args[0] = flowletManager.wrap(func, eventHandler.name);
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
            args[0] = flowletManager.wrap(handler, fi.name);
            return args;
        });
    }
    IPromise.then.onArgsMapperAdd(args => {
        args[0] = flowletManager.wrap(args[0], IPromise.then.name);
        args[1] = flowletManager.wrap(args[1], IPromise.then.name);
        return args;
    });
    IPromise.Catch.onArgsMapperAdd(args => {
        args[0] = flowletManager.wrap(args[0], IPromise.Catch.name);
        return args;
    });
    IEventTarget.addEventListener.onArgsMapperAdd(args => {
        args[1] = flowletManager.wrap(args[1], `${IEventTarget.addEventListener.name}:${args[0]}`);
        return args;
    });
    IEventTarget.removeEventListener.onArgsMapperAdd(args => {
        args[1] = flowletManager.unwrap(args[1]);
        return args;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7R0FFRztBQUVILE9BQU8sS0FBSyxXQUFXLE1BQU0seUNBQXlDLENBQUM7QUFDdkUsT0FBTyxLQUFLLFFBQVEsTUFBTSxzQ0FBc0MsQ0FBQztBQUNqRSxPQUFPLEtBQUssWUFBWSxNQUFNLHlDQUF5QyxDQUFDO0FBQ3hFLE9BQU8sS0FBSyxvQkFBb0IsTUFBTSxpREFBaUQsQ0FBQztBQUN4RixPQUFPLEtBQUssT0FBTyxNQUFNLG9DQUFvQyxDQUFDO0FBQzlELE9BQU8sS0FBSyxPQUFPLE1BQU0sb0NBQW9DLENBQUM7QUFDOUQsT0FBTyxLQUFLLGVBQWUsTUFBTSw0Q0FBNEMsQ0FBQztBQUc5RSxNQUFNLFVBQVUsbUJBQW1CLENBQUMsY0FBOEI7SUFDaEUsS0FBSyxNQUFNLFlBQVksSUFBSTtRQUN6QixPQUFPLENBQUMsY0FBYztRQUN0QixPQUFPLENBQUMsbUJBQW1CO1FBQzNCLE9BQU8sQ0FBQyxtQkFBbUI7UUFDM0Isb0JBQW9CLENBQUMsT0FBTztRQUM1QixvQkFBb0IsQ0FBQyxpQkFBaUI7UUFDdEMsb0JBQW9CLENBQUMsY0FBYztRQUNuQyxvQkFBb0IsQ0FBQyxvQkFBb0I7UUFDekMsb0JBQW9CLENBQUMsZ0JBQWdCO1FBQ3JDLG9CQUFvQixDQUFDLFVBQVU7UUFDL0Isb0JBQW9CLENBQUMsTUFBTTtRQUMzQixvQkFBb0IsQ0FBQyxTQUFTO1FBQzlCLG9CQUFvQixDQUFDLGdCQUFnQjtRQUNyQyxvQkFBb0IsQ0FBQyxRQUFRO1FBQzdCLG9CQUFvQixDQUFDLE9BQU87UUFDNUIsb0JBQW9CLENBQUMsT0FBTztRQUM1QixvQkFBb0IsQ0FBQyxhQUFhO1FBQ2xDLG9CQUFvQixDQUFDLFdBQVc7UUFDaEMsb0JBQW9CLENBQUMsVUFBVTtRQUMvQixvQkFBb0IsQ0FBQyxNQUFNO1FBQzNCLG9CQUFvQixDQUFDLFNBQVM7UUFD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