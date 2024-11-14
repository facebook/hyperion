/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { assert } from "hyperion-global";
import { getVirtualAttribute } from "./DOMShadowPrototype";
import * as IElement from "./IElement_";

export function init() {

  IElement.getAttribute.setCustom(function (this, name) {
    const vattr = getVirtualAttribute(this, name);
    if (vattr) {
      const attrVal = vattr.getRawValue(this);
      if (attrVal !== null) {
        return attrVal;
      }
    }
    return IElement.getAttribute.getOriginal().apply(this, <any>arguments);
  });

  IElement.setAttribute.setCustom(function (this, name, value) {
    const vattr = getVirtualAttribute(this, name);
    if (vattr) {
      return vattr.setRawValue(this, value);
    } else {
      return IElement.setAttribute.getOriginal().apply(this, <any>arguments);
    }
  });

  IElement.getAttributeNS.setCustom(function (this, _namespace, name) {
    const vattr = getVirtualAttribute(this, name);
    if (vattr) {
      var attrVal = vattr.getRawValue(this);
      if (attrVal !== null) {
        return attrVal;
      }
    }
    return IElement.getAttributeNS.getOriginal().apply(this, <any>arguments);
  });

  IElement.setAttributeNS.setCustom(function (this, _namespace, name, value) {
    const vattr = getVirtualAttribute(this, name);
    if (vattr) {
      return vattr.setRawValue(this, value);
    } else {
      return IElement.setAttributeNS.getOriginal().apply(this, <any>arguments);
    }
  });

  function createSetAttributeNodeCustom(originalFunc: Function) {
    return function (this: Element, newAttr: Attr) {
      var result;
      const notAlreadyAttached = !newAttr.ownerElement;
      const vattr = getVirtualAttribute(this, newAttr.name);
      if (notAlreadyAttached && vattr) {
        //The custom logic for Attr has not run before (see IAttrCustom), so trigger it now
        const value = newAttr.value; //In case .value changes after attaching, or if there is pending custom logic

        result = originalFunc.call(this, newAttr);
        __DEV__ && assert(!!newAttr.ownerElement, "Attr must now be attached to an ownerElement");
        vattr.setRawValue(this, value);
      } else {
        result = originalFunc.call(this, newAttr);
      }
      return result;
    }
  }
  IElement.setAttributeNode.setCustom(createSetAttributeNodeCustom(IElement.setAttributeNode.getOriginal()));
  IElement.setAttributeNodeNS.setCustom(createSetAttributeNodeCustom(IElement.setAttributeNodeNS.getOriginal()));

  //TODO: add logic for removeAttribute*
}
