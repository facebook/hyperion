/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import * as IGlobalThis from "hyperion-core/src/IGlobalThis";
import * as IPromise from "hyperion-core/src/IPromise";
import * as IEventTarget from "hyperion-dom/src/IEventTarget";
// import * as IGlobalEventHandlers from "hyperion-dom/src/IGlobalEventHandlers";
import * as IWindow from "hyperion-dom/src/IWindow";
// import * as IWorker from "hyperion-dom/src/IWorker";
import * as IXMLHttpRequest from "hyperion-dom/src/IXMLHttpRequest";
import TestAndSet from "hyperion-test-and-set/src/TestAndSet";
import { FlowletManager } from "./FlowletManager";
import { TriggerFlowlet, getTriggerFlowlet, setTriggerFlowlet } from "./TriggerFlowlet";
import { getVirtualPropertyValue, setVirtualPropertyValue } from "hyperion-core/src/intercept";

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
    eventHandler.setter.onBeforeCallMapperAdd(function (this, args: [any]) {
      const func = args[0];
      args[0] = flowletManager.wrap(func, eventHandler.name, getTriggerFlowletFromEvent);
      return args;
    });
  }

  IEventTarget.addEventListener.onBeforeCallMapperAdd(args => {
    args[1] = flowletManager.wrap(args[1], `${IEventTarget.addEventListener.name}(${args[0]})`, getTriggerFlowletFromEvent);
    return args;
  });
  IEventTarget.removeEventListener.onBeforeCallMapperAdd(args => {
    args[1] = flowletManager.getWrappedOrOriginal(args[1]);
    return args;
  });

  for (const fi of [
    IGlobalThis.setTimeout,
    IGlobalThis.setInterval
  ]) {
    fi.onBeforeCallMapperAdd(args => {
      let handler = args[0];
      if (typeof handler === "string") {
        handler = new Function(handler);
      }
      args[0] = flowletManager.wrap(handler, fi.name);
      return args;
    });
  }

  for (const fi of [
    IWindow.requestIdleCallback,
  ]) {
    fi.onBeforeCallMapperAdd(args => {
      let handler = args[0];
      args[0] = flowletManager.wrap(handler, fi.name);
      return args;
    });
  }

  for (const fi of [
    IWindow.requestAnimationFrame,
  ]) {
    fi.onBeforeCallMapperAdd(args => {
      let handler = args[0];
      args[0] = flowletManager.wrap(handler, fi.name);
      return args;
    });
  }

  for (const fi of [
    IPromise.constructor,
    IPromise.resolve,
    IPromise.reject
  ]) {
    fi.onAfterCallObserverAdd(value => {
      if (!getTriggerFlowlet(value)) {
        const triggerFlowlet = flowletManager.top()?.data.triggerFlowlet;
        if (triggerFlowlet) {
          setTriggerFlowlet(value, triggerFlowlet);
        }
      }
    });
  }

  const MAX_TRIGGER_FLOWLET_CHAIN = 5;

  for (const fi of [
    IPromise.all,
    IPromise.allSettled,
    IPromise.any,
    IPromise.race
  ]) {
    fi.onBeforeAndAfterCallMapperAdd(args => {
      const iterable = args[0];
      if (iterable.length === 1) {
        // This is special case, we can optimize for right away
        const arg = iterable[0];
        const triggerFlowlet = (arg instanceof Promise) && getTriggerFlowlet(arg);
        if (triggerFlowlet) {
          return value => {
            setTriggerFlowlet(value, triggerFlowlet);
            return value;
          }
        }
      }

      return value => {
        const topTriggerFlowlet = getTriggerFlowlet(value) ?? flowletManager.top()?.data.triggerFlowlet;
        const triggerFlowlets = new Set<TriggerFlowlet>();
        // Args can be iterable, so we use the modern for-loop https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all#parameters
        let suffix = '';
        for (const arg of iterable) {
          if (arg instanceof Promise) {
            const triggerFlowlet = getTriggerFlowlet(arg);
            if (triggerFlowlet) {
              triggerFlowlets.add(triggerFlowlet);
              if (triggerFlowlets.size >= MAX_TRIGGER_FLOWLET_CHAIN) {
                suffix = '...';
                break;
              }
            }
          }
        }

        if (triggerFlowlets.size > 0) {
          const triggerFlowletsArray = Array.from(triggerFlowlets);
          const flowletName = `Promise.${fi.name}(${triggerFlowletsArray.map(f => f.id).join("&")}${suffix})`;
          const triggerFlowlet = new flowletManager.flowletCtor(flowletName, topTriggerFlowlet);
          setTriggerFlowlet(value, triggerFlowlet);
        } else if (topTriggerFlowlet) {
          setTriggerFlowlet(value, topTriggerFlowlet);
        }

        return value;
      }
    });

  }

  /**
   * We may have many .then or .chatch chained together, we can be a bit smarter and reuse the 
   * trigger flowlet getters.
   * More importantly, the .catch may call .then behind the scenes, and we will get a lot
   * of warning during wrapping. 
   * So, we attach one flowlet getter to the promise, and reuse it for all .then and .catch
   */

  type TriggerFlowletGetter = () => TriggerFlowlet | null | undefined;
  const PromiseTriggerFlowletGetterProp = "_PROMISE_TRIGGER_FLOWLET_GETTER";
  function getTriggerFlowletGetter(p: Promise<any>): TriggerFlowletGetter {
    let getter = getVirtualPropertyValue<TriggerFlowletGetter>(p, PromiseTriggerFlowletGetterProp);
    if (!getter) {
      getter = () => getTriggerFlowlet(p);
      setVirtualPropertyValue(p, PromiseTriggerFlowletGetterProp, getter);
    }
    return getter;
  }

  IPromise.then.onBeforeAndAfterCallMapperAdd(function (this, args) {
    const triggerFlowletGetter = getTriggerFlowletGetter(this);
    args[0] = flowletManager.wrap(args[0], IPromise.then.name, triggerFlowletGetter);
    args[1] = flowletManager.wrap(args[1], IPromise.then.name, triggerFlowletGetter);
    return value => {
      if (value !== this) {
        const triggerFlowlet = getTriggerFlowlet(this);
        const newTriggerFlowlet = getTriggerFlowlet(value);
        if (triggerFlowlet && !newTriggerFlowlet) {
          setTriggerFlowlet(value, triggerFlowlet);
        }
      }
      return value;
    };
  });

  IPromise.Catch.onBeforeAndAfterCallMapperAdd(function (this, args) {
    const triggerFlowletGetter = getTriggerFlowletGetter(this);
    args[0] = flowletManager.wrap(args[0], IPromise.then.name, triggerFlowletGetter);
    return value => {
      if (value !== this) {
        const triggerFlowlet = getTriggerFlowlet(this);
        const newTriggerFlowlet = getTriggerFlowlet(value);
        if (triggerFlowlet && !newTriggerFlowlet) {
          setTriggerFlowlet(value, triggerFlowlet);
        }
      }
      return value;
    };
  });
}
