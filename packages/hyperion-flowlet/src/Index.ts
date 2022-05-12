/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { isIntercepted } from "@hyperion/hyperion-core/src/intercept";
import { CallbackType, interceptEventListener, isEventListenerObject } from "@hyperion/hyperion-dom/src/IEventListener";
import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
import * as IGlobalEventHandlers from "@hyperion/hyperion-dom/src/IGlobalEventHandlers";
import * as IPromise from "@hyperion/hyperion-core/src/IPromise";
import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
import * as IGlobalThis from "@hyperion/hyperion-core/src/IGlobalThis";
// import * as IWorker from "@hyperion/hyperion-dom/src/IWorker";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
import { FlowletManager } from "./FlowletManager";

export function initFlowletTrackers(flowletManager: FlowletManager) {

  const IS_SETUP_PROP_NAME = `__isSetup`;
  function wrap<T extends CallbackType | undefined | null>(listener: T): T {
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
      })
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
    return isEventListenerObject(listener) ? listener : <T>funcInterceptor.interceptor;
  }

  function unwrap<T extends CallbackType | undefined | null>(listener: T): T {
    if (listener && !isEventListenerObject(listener) && isIntercepted(listener)) {
      const funcInterceptor = interceptEventListener(listener);
      return <T>funcInterceptor.getOriginal();
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
    eventHandler.setter.onArgsMapperAdd(function (this, args: [any]) {
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
    })
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