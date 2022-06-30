/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IGlobalThis from "@hyperion/hyperion-core/src/IGlobalThis";
import * as IPromise from "@hyperion/hyperion-core/src/IPromise";
import * as IEventTarget from "@hyperion/hyperion-dom/src/IEventTarget";
// import * as IGlobalEventHandlers from "@hyperion/hyperion-dom/src/IGlobalEventHandlers";
// import * as IWindow from "@hyperion/hyperion-dom/src/IWindow";
// import * as IWorker from "@hyperion/hyperion-dom/src/IWorker";
import * as IXMLHttpRequest from "@hyperion/hyperion-dom/src/IXMLHttpRequest";
import { FlowletManager } from "./FlowletManager";

export function initFlowletTrackers(flowletManager: FlowletManager) {
  for (const eventHandler of [
    // IWindow.ondevicemotion,
    // IWindow.ondeviceorientation,
    // IWindow.onorientationchange,
    // IGlobalEventHandlers.onabort,
    // IGlobalEventHandlers.onanimationcancel,
    // IGlobalEventHandlers.onanimationend,
    // IGlobalEventHandlers.onanimationiteration,
    // IGlobalEventHandlers.onanimationstart,
    // IGlobalEventHandlers.onauxclick,
    // IGlobalEventHandlers.onblur,
    // IGlobalEventHandlers.oncanplay,
    // IGlobalEventHandlers.oncanplaythrough,
    // IGlobalEventHandlers.onchange,
    // IGlobalEventHandlers.onclick,
    // IGlobalEventHandlers.onclose,
    // IGlobalEventHandlers.oncontextmenu,
    // IGlobalEventHandlers.oncuechange,
    // IGlobalEventHandlers.ondblclick,
    // IGlobalEventHandlers.ondrag,
    // IGlobalEventHandlers.ondragend,
    // IGlobalEventHandlers.ondragenter,
    // IGlobalEventHandlers.ondragleave,
    // IGlobalEventHandlers.ondragover,
    // IGlobalEventHandlers.ondragstart,
    // IGlobalEventHandlers.ondrop,
    // IGlobalEventHandlers.ondurationchange,
    // IGlobalEventHandlers.onemptied,
    // IGlobalEventHandlers.onended,
    // IGlobalEventHandlers.onfocus,
    // IGlobalEventHandlers.onformdata,
    // IGlobalEventHandlers.ongotpointercapture,
    // IGlobalEventHandlers.oninput,
    // IGlobalEventHandlers.oninvalid,
    // IGlobalEventHandlers.onkeydown,
    // IGlobalEventHandlers.onkeypress,
    // IGlobalEventHandlers.onkeyup,
    // IGlobalEventHandlers.onload,
    // IGlobalEventHandlers.onloadeddata,
    // IGlobalEventHandlers.onloadedmetadata,
    // IGlobalEventHandlers.onloadstart,
    // IGlobalEventHandlers.onlostpointercapture,
    // IGlobalEventHandlers.onmousedown,
    // IGlobalEventHandlers.onmouseenter,
    // IGlobalEventHandlers.onmouseleave,
    // IGlobalEventHandlers.onmousemove,
    // IGlobalEventHandlers.onmouseout,
    // IGlobalEventHandlers.onmouseover,
    // IGlobalEventHandlers.onmouseup,
    // IGlobalEventHandlers.onpause,
    // IGlobalEventHandlers.onplay,
    // IGlobalEventHandlers.onplaying,
    // IGlobalEventHandlers.onpointercancel,
    // IGlobalEventHandlers.onpointerdown,
    // IGlobalEventHandlers.onpointerenter,
    // IGlobalEventHandlers.onpointerleave,
    // IGlobalEventHandlers.onpointermove,
    // IGlobalEventHandlers.onpointerout,
    // IGlobalEventHandlers.onpointerover,
    // IGlobalEventHandlers.onpointerup,
    // IGlobalEventHandlers.onprogress,
    // IGlobalEventHandlers.onratechange,
    // IGlobalEventHandlers.onreset,
    // IGlobalEventHandlers.onresize,
    // IGlobalEventHandlers.onscroll,
    // IGlobalEventHandlers.onsecuritypolicyviolation,
    // IGlobalEventHandlers.onseeked,
    // IGlobalEventHandlers.onseeking,
    // IGlobalEventHandlers.onselect,
    // IGlobalEventHandlers.onselectionchange,
    // IGlobalEventHandlers.onselectstart,
    // IGlobalEventHandlers.onslotchange,
    // IGlobalEventHandlers.onstalled,
    // IGlobalEventHandlers.onsubmit,
    // IGlobalEventHandlers.onsuspend,
    // IGlobalEventHandlers.ontimeupdate,
    // IGlobalEventHandlers.ontoggle,
    // IGlobalEventHandlers.ontouchcancel,
    // IGlobalEventHandlers.ontouchend,
    // IGlobalEventHandlers.ontouchmove,
    // IGlobalEventHandlers.ontouchstart,
    // IGlobalEventHandlers.ontransitioncancel,
    // IGlobalEventHandlers.ontransitionend,
    // IGlobalEventHandlers.ontransitionrun,
    // IGlobalEventHandlers.ontransitionstart,
    // IGlobalEventHandlers.onvolumechange,
    // IGlobalEventHandlers.onwaiting,
    // IGlobalEventHandlers.onwebkitanimationend,
    // IGlobalEventHandlers.onwebkitanimationiteration,
    // IGlobalEventHandlers.onwebkitanimationstart,
    // IGlobalEventHandlers.onwebkittransitionend,
    // IGlobalEventHandlers.onwheel,
    // IGlobalEventHandlers.onafterprint,
    // IGlobalEventHandlers.onbeforeprint,
    // IGlobalEventHandlers.onbeforeunload,
    // IGlobalEventHandlers.ongamepadconnected,
    // IGlobalEventHandlers.ongamepaddisconnected,
    // IGlobalEventHandlers.onhashchange,
    // IGlobalEventHandlers.onlanguagechange,
    // IGlobalEventHandlers.onmessage,
    // IGlobalEventHandlers.onmessageerror,
    // IGlobalEventHandlers.onoffline,
    // IGlobalEventHandlers.ononline,
    // IGlobalEventHandlers.onpagehide,
    // IGlobalEventHandlers.onpageshow,
    // IGlobalEventHandlers.onpopstate,
    // IGlobalEventHandlers.onrejectionhandled,
    // IGlobalEventHandlers.onstorage,
    // IGlobalEventHandlers.onunhandledrejection,
    // IGlobalEventHandlers.onunload,
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
    })
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