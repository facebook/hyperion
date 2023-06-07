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
import TestAndSet from "@hyperion/hyperion-util/src/TestAndSet";
import { FlowletManager } from "./FlowletManager";
import { TriggerFlowlet, getTriggerFlowlet, setTriggerFlowlet } from "./TriggerFlowlet";

const initialized = new TestAndSet();

export function initFlowletTrackers(flowletManager: FlowletManager) {
  if (initialized.testAndSet()) {
    return;
  }

  function getTriggerFlowletFromEvent(event?: Event) {
    /**
     * The trigger flowlet may be assigned to the event itself (e.g. for interaction events)
     * or assigned to the event.target (e.g. for XHR events)
     * So, we try both to conver all cases.
     */
    return getTriggerFlowlet(event) ?? getTriggerFlowlet(event?.target);
  }

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
    IXMLHttpRequest.readystatechange,
    IXMLHttpRequest.ontimeout,
  ]) {
    eventHandler.setter.onBeforeCallArgsMapperAdd(function (this, args: [any]) {
      const func = args[0];
      args[0] = flowletManager.wrap(func, eventHandler.name, void 0, getTriggerFlowletFromEvent);
      return args;
    });
  }

  IEventTarget.addEventListener.onBeforeCallArgsMapperAdd(args => {
    args[1] = flowletManager.wrap(args[1], `${IEventTarget.addEventListener.name}(${args[0]})`, void 0, getTriggerFlowletFromEvent);
    return args;
  });
  IEventTarget.removeEventListener.onBeforeCallArgsMapperAdd(args => {
    args[1] = flowletManager.getWrappedOrOriginal(args[1]);
    return args;
  });

  for (const fi of [
    IGlobalThis.setTimeout,
    IGlobalThis.setInterval
  ]) {
    fi.onBeforeCallArgsMapperAdd(args => {
      let handler = args[0];
      if (typeof handler === "string") {
        handler = new Function(handler);
      }
      args[0] = flowletManager.wrap(handler, fi.name);
      return args;
    })
  }

  for (const fi of [
    IPromise.constructor,
    IPromise.resolve,
    IPromise.reject
  ]) {
    fi.onAfterReturnValueObserverAdd(value => {
      if (!getTriggerFlowlet(value)) {
        const triggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
        if (triggerFlowlet) {
          setTriggerFlowlet(value, triggerFlowlet);
        }
      }
    });
  }

  for (const fi of [
    IPromise.all,
    IPromise.allSettled,
    IPromise.any,
    IPromise.race
  ]) {
    fi.onBeforeCallArgsAndAfterReturnValueMapperAdd(args => {
      const iterable = args[0];
      return value => {
        const topTriggerFlowlet = getTriggerFlowlet(value) ?? flowletManager.top()?.data.triggerFlowlet;
        const triggerFlowlets: TriggerFlowlet[] = [];
        // Args can be iterable, so we use the modern for-loop https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all#parameters
        for (const arg of iterable) {
          if (arg instanceof Promise) {
            const triggerFlowlet = getTriggerFlowlet(arg);
            if (triggerFlowlet) {
              triggerFlowlets.push(triggerFlowlet);
            }
          }
        }

        if (triggerFlowlets.length > 0) {
          const flowletName = `Promise.${fi.name}(${triggerFlowlets.map(f => f.id).join("&")})`;
          const triggerFlowlet = new flowletManager.flowletCtor(flowletName, topTriggerFlowlet);
          setTriggerFlowlet(value, triggerFlowlet);
        } else if (topTriggerFlowlet) {
          setTriggerFlowlet(value, topTriggerFlowlet);
        }

        return value;
      }
    });

  }


  IPromise.then.onBeforeCallArgsAndAfterReturnValueMapperAdd(function (this, args) {
    const triggerFlowlet = getTriggerFlowlet(this);
    args[0] = flowletManager.wrap(args[0], IPromise.then.name, void 0, () => triggerFlowlet);
    args[1] = flowletManager.wrap(args[1], IPromise.then.name, void 0, () => triggerFlowlet);
    return value => {
      if (value !== this && triggerFlowlet) {
        const newTriggerFlowlet = getTriggerFlowlet(value);
        if (!newTriggerFlowlet) {
          setTriggerFlowlet(value, triggerFlowlet);
        }
      }
      return value;
    };
  });

  IPromise.Catch.onBeforeCallArgsAndAfterReturnValueMapperAdd(function (this, args) {
    const triggerFlowlet = getTriggerFlowlet(this);
    args[0] = flowletManager.wrap(args[0], IPromise.then.name, void 0, () => triggerFlowlet);
    return value => {
      if (value !== this && triggerFlowlet) {
        const newTriggerFlowlet = getTriggerFlowlet(value);
        if (!newTriggerFlowlet) {
          setTriggerFlowlet(value, triggerFlowlet);
        }
      }
      return value;
    };
  });
}