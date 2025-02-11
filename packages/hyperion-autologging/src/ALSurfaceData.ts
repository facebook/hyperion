/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "hyperion-globals/src/assert";
import { SURFACE_SEPARATOR } from "./ALSurfaceConsts";
import type { ALSurfaceMutationEventData } from "./ALSurfaceMutationPublisher";
import type { ALSurfaceVisibilityEventData } from "./ALSurfaceVisibilityPublisher";


export type ALSurfaceEvent = Readonly<{
  surface: string;
  surfaceData: ALSurfaceData;
}>;

const surfacesData = new Map<string, ALSurfaceData>();

const PARENT_SURFACE_REMOVEd_PROP = 'parentSurfaceRemoved';

export class ALSurfaceData {

  static get(surface: string): ALSurfaceData {
    let data = surfacesData.get(surface);
    if (!data) {
      const parentNameLength = surface.lastIndexOf(SURFACE_SEPARATOR);
      let parentData: ALSurfaceData | null = null;
      if (parentNameLength > 0) {
        let parentSurfaceName = surface.substring(0, parentNameLength);
        parentData = ALSurfaceData.get(parentSurfaceName);

      }
      data = new ALSurfaceData(surface, parentData);
      parentData?.children.push(data);
      surfacesData.set(surface, data);
    }
    return data;
  }

  private __ext: { [namespace: string]: any; };
  readonly children: ALSurfaceData[] = [];
  mutationEvent: ALSurfaceMutationEventData | null = null;
  visibilityEvent: ALSurfaceVisibilityEventData | null = null;

  constructor(
    public readonly surface: string,
    readonly parent: ALSurfaceData | null,
  ) {
    this.__ext = Object.create(this.parent?.__ext ?? null);
  }

  remove() {
    /**
     * While mount event happens bottom-up, the unmount event (may) happens top down.
     * We can remove the parent surface that still has childern from the map, and let the
     * data to be GCed later. But we mark these just incase later we need to debug what is
     * happeneing.
     */
    const isChildless = this.children.length === 0

    if (__DEV__ && !isChildless) {
      // console.debug(`Children of surface ${this.surface} will be orphan!`);
      this.setInheritedPropery(PARENT_SURFACE_REMOVEd_PROP, true);
    }

    const parentsChildren = this.parent?.children;
    if (parentsChildren) {
      // The following is a fast remove
      const index = parentsChildren.indexOf(this);
      __DEV__ && assert(index > -1, `Invalid situation! surface ${this.surface} should be child of ${this.parent.surface}`);
      if (index > -1) {
        parentsChildren[index] = parentsChildren[parentsChildren.length - 1]; // move the last one to the found location
        parentsChildren.length -= 1;
        if (__DEV__ && parentsChildren.length == 0 && this.parent.getInheritedPropery(PARENT_SURFACE_REMOVEd_PROP)) {
          // console.debug(`Parent surface ${this.parent.surface} cleaned up`);
        }
      }
    }

    surfacesData.delete(this.surface);
  }

  getInheritedPropery<T>(propName: string): T | undefined | null {
    return this.__ext[propName] as T;
  }

  setInheritedPropery<T>(propName: string, propValue: T): T {
    this.__ext[propName] = propValue;
    return propValue;
  }

}
