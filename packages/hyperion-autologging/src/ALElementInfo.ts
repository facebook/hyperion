/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getReactComponentData_THIS_CAN_BREAK } from './ALReactUtils';
import type { ReactComponentData } from './ALReactUtils';
import { getVirtualPropertyValue, setVirtualPropertyValue } from '@hyperion/hyperion-core/src/intercept';

const AL_ELEMENT_INFO_PROPNAME = '__alInfo';
const AUTO_LOGGING_COMPONENT_TYPE = 'data-auto-logging-component-type';

export default class ALElementInfo {
  element: Element;
  private reactComponentData: ReactComponentData | null = null;
  private reactComponentType: string | null = null;

  constructor(
    element: Element
  ) {
    this.element = element;
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

  getReactComponentData(): ReactComponentData | null {
    if (!this.reactComponentData) {
      this.reactComponentData = getReactComponentData_THIS_CAN_BREAK(
        this.element,
      );
    }
    return this.reactComponentData;
  }

  getReactComponentType(): string | null {
    if (!this.reactComponentType) {
      this.reactComponentType = this.element.getAttribute(AUTO_LOGGING_COMPONENT_TYPE);
    }
    return this.reactComponentType;
  }
}
