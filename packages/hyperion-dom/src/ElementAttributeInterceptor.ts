/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

import { AttributeInterceptor, AttributeInterceptorBase, interceptAttributeBase } from "hyperion-core/src/AttributeInterceptor";
import { ExtendedPropertyDescriptor } from "hyperion-core/src/PropertyInterceptor";
import { ShadowPrototype } from "hyperion-core/src/ShadowPrototype";
import * as IAttrCustom from "./IAttrCustom";
import * as IElementCustom from "./IElementCustom";
import * as IElement from "./IElement_";
import { VirtualAttribute } from "./VirtualAttribute";


let lazyInit = () => {
  IAttrCustom.init();
  IElementCustom.init();
  lazyInit = () => { };
}

export class ElementAttributeInterceptor<
  BaseType extends Element & { [key: string]: any },
  Name extends string,
  GetAttrType = BaseType[Name] | string | null,
  SetAttrType = GetAttrType | string,
> extends AttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType> {

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
      new VirtualAttribute<BaseType, Name, string | null, string, GetAttrType, SetAttrType>(this.raw, this)
    );

    lazyInit();
  }
}

export function interceptElementAttribute<
  BaseType extends Element & { [key: string]: any },
  Name extends string,
  GetAttrType = BaseType[Name],
  SetAttrType = GetAttrType,
>(
  name: Name,
  shadowPrototype: ShadowPrototype<BaseType>
): ElementAttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType> {
  return interceptAttributeBase<BaseType, Name, GetAttrType, SetAttrType, ElementAttributeInterceptor<BaseType, Name, GetAttrType, SetAttrType>>(name, shadowPrototype, ElementAttributeInterceptor);
}