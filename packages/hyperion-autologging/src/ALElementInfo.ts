/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getReactComponentData_THIS_CAN_BREAK } from './ALReactUtils';
import type { ReactComponentData } from './ALReactUtils';
import { getVirtualPropertyValue, intercept, setVirtualPropertyValue } from '@hyperion/hyperion-core/src/intercept';
import * as IElement from "@hyperion/hyperion-dom/src/IElement";

const AL_ELEMENT_INFO_PROPNAME = '__alInfo';
const AUTO_LOGGING_COMPONENT_TYPE = 'data-auto-logging-component-type';
export type BailTraversalFunc = (foundReactComponent: boolean, depth: number) => boolean;

export default class ALElementInfo {
  element: Element;
  private reactComponentData: ReactComponentData | null = null;
  private reactComponentType: string | null = null;

  constructor(
    element: Element
  ) {
    this.element = element;
    intercept(element, IElement.IElementtPrototype); // This also ensures that proper interception is setup.
    setVirtualPropertyValue(
      element,
      AL_ELEMENT_INFO_PROPNAME,
      this,
    );
    this.cacheInfo();
  }

  private cacheInfo(): void {
    this.getReactComponentData();
    this.getReactComponentType();
  }

  static get(element: Element): ALElementInfo | undefined {
    return getVirtualPropertyValue<ALElementInfo>(
      element,
      AL_ELEMENT_INFO_PROPNAME,
    );
  }

  static getOrCreate(element: Element): ALElementInfo {
    return ALElementInfo.get(element) ?? new ALElementInfo(element);
  }

  static getReactComponentData(element: Element, bailTraversalFunc?: BailTraversalFunc): ReactComponentData | null {
    return getReactComponentData_THIS_CAN_BREAK(element, bailTraversalFunc);
  }

  getReactComponentData(): ReactComponentData | null {
    if (!this.reactComponentData) {
      this.reactComponentData = getReactComponentData_THIS_CAN_BREAK(
        this.element,
      );
    }
    return this.reactComponentData;
  }

  getReactComponentName(): string | null | undefined {
    return this.getReactComponentData()?.name;
  }

  getReactComponentType(): string | null {
    if (!this.reactComponentType) {
      this.reactComponentType = this.element.getAttribute(AUTO_LOGGING_COMPONENT_TYPE);
    }
    return this.reactComponentType;
  }
}
