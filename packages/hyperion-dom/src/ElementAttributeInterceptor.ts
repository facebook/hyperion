/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor, AttributeInterceptorBase, getAttributeInterceptor } from "@hyperion/hyperion-core/src/AttributeInterceptor";
import { ShadowPrototype } from "@hyperion/hyperion-core/src/ShadowPrototype";
import * as IElement from "./IElement_";
import * as IAttrCustom from "./IAttrCustom";
import * as IElementCustom from "./IElementCustom";
import { VirtualAttribute } from "./VirtualAttribute";
import { ExtendedPropertyDescriptor } from "@hyperion/hyperion-core/src/PropertyInterceptor";


let lazyInit = () => {
  IAttrCustom.init();
  IElementCustom.init();
  lazyInit = () => { };
}

class ElementAttributeInterceptor<
  BaseType extends Element & { [key: string]: any },
  Name extends string,
  > extends AttributeInterceptor<BaseType, Name, string, string> {

  public readonly raw: AttributeInterceptorBase<
    BaseType,
    Name,
    (this: BaseType) => string | null,
    (this: BaseType, value: string) => void
  >;

  constructor(name: Name, shadowPrototype: ShadowPrototype<BaseType>, desc?: ExtendedPropertyDescriptor) {
    super(name, shadowPrototype, desc);
    this.raw = new AttributeInterceptorBase(name,
      function (this: BaseType) {
        return IElement.getAttribute.getOriginal().call(this, name);
      },
      function (this: BaseType, value: string) {
        return IElement.setAttribute.getOriginal().call(this, name, value);
      }
    );

    IElement.IElementtPrototype.setVirtualProperty(
      name,
      new VirtualAttribute<BaseType, Name, string | null, string>(this.raw, this)
    );

    lazyInit();
  }
}

export function interceptElementAttribute<
  BaseType extends Element & { [key: string]: any },
  Name extends string,
  >(
    name: Name,
    shadowPrototype: ShadowPrototype<BaseType>
  ): ElementAttributeInterceptor<BaseType, Name> {
  const desc = getAttributeInterceptor<BaseType, Name, string, string, ElementAttributeInterceptor<BaseType, Name>>(name, shadowPrototype);
  return desc?.interceptor ?? new ElementAttributeInterceptor(name, shadowPrototype, desc);
}