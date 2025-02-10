/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "hyperion-globals/src/assert";
import { SURFACE_SEPARATOR } from "./ALSurfaceConsts";
import type { ALSurfaceMutationEventData } from "./ALSurfaceMutationPublisher";
import type { ALSurfaceVisibilityEventData } from "./ALSurfaceVisibilityPublisher";
import type { ALExtensibleEventData } from "./ALType";


const surfacesData = new Map<string, ALSurfaceData>();

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

  private __ext: { [namespace: string]: ALExtensibleEventData; };
  readonly children: ALSurfaceData[] = [];
  mutationEvent?: ALSurfaceMutationEventData;
  visibilityEvent?: ALSurfaceVisibilityEventData;

  constructor(
    public readonly surface: string,
    readonly parent: ALSurfaceData | null,
  ) {
    this.__ext = Object.create(this.parent?.__ext ?? null);
  }

  remove() {
    const isChildless = this.children.length === 0
    assert(isChildless, "Cannot remove surface that still has children");
    if (!isChildless) {
      return;
    }

    const parentsChildren = this.parent?.children;
    if (parentsChildren) {
      // The following is a fast remove
      const index = parentsChildren.indexOf(this);
      if (index > -1) {
        parentsChildren[index] = parentsChildren[parentsChildren.length - 1]; // move the last one to the found location
        parentsChildren.length -= 1;
      }
    }

    surfacesData.delete(this.surface);

  }

  getExtension<T extends ALExtensibleEventData = ALExtensibleEventData>(namespace: string): T | undefined | null {
    return this.__ext[namespace] as T;
  }

  setExtension<T extends ALExtensibleEventData = ALExtensibleEventData>(namespace: string, data: T): void {
    const namespaceData = this.__ext[namespace] ??= {};
    Object.assign(namespaceData, data);
  }

}
