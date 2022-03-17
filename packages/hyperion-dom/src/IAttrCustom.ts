/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { getVirtualAttribute } from "./DOMShadowPrototype";
import * as IAttr from "./IAttr";


export function init() {
  IAttr.value.getter.setCustom(function (this): string {
    var attr = this;
    var ownerElement = attr.ownerElement;
    if (ownerElement) {
      var vattr = getVirtualAttribute(ownerElement, attr.name);
      if (vattr) {
        var attrVal = vattr.getRawValue(ownerElement);
        if (attrVal != null) {
          return attrVal;
        }
      }
    }
    return IAttr.value.getter.getOriginal().call(attr);
  });

  IAttr.value.setter.setCustom(function (this, value) {
    var attr = this;
    var ownerElement = attr.ownerElement;
    if (ownerElement) {
      var vattr = getVirtualAttribute(ownerElement, attr.name);
      if (vattr) {
        return vattr.setRawValue(ownerElement, value);
      }
    }
    return IAttr.value.setter.getOriginal().call(attr, value);
  });
}