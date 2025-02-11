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
export class ALSurfaceData {
  static root = (() => {
    const root = new ALSurfaceData('', null);
    root.#locked = true; // We never want this to be removed.
    return root;
  })();

  static get(surface: string): ALSurfaceData {
    let data = surfacesData.get(surface);
    if (!data) {
      const parentNameLength = surface.lastIndexOf(SURFACE_SEPARATOR);
      let parentData: ALSurfaceData = ALSurfaceData.root;
      if (parentNameLength > 0) {
        let parentSurfaceName = surface.substring(0, parentNameLength);
        parentData = ALSurfaceData.get(parentSurfaceName);
      }
      data = new ALSurfaceData(surface, parentData);
      parentData.children.push(data);
      surfacesData.set(surface, data);
      console.log(`Added surface: ${surface}`);
    }
    return data;
  }

  private __ext: { [namespace: string]: any; };
  readonly children: ALSurfaceData[] = [];
  #mutationEvent: ALSurfaceMutationEventData | null = null;
  #visibilityEvent: ALSurfaceVisibilityEventData | null = null;
  #locked: boolean = false; // allow removal by default

  constructor(
    public readonly surface: string,
    public readonly parent: ALSurfaceData | null,
  ) {
    this.__ext = Object.create(this.parent?.__ext ?? null);
  }

  getMutationEvent(): ALSurfaceMutationEventData | null {
    return this.#mutationEvent;
  }
  setMutationEvent(event: ALSurfaceMutationEventData): ALSurfaceMutationEventData {
    if (event === null) {
      __DEV__ && assert(this.#mutationEvent?.event === "unmount_component", "Deactivating surface without unmouting it first");
      this.#visibilityEvent = null;
    }
    this.#mutationEvent = event;
    return event;
  }

  getVisibilityEvent(): ALSurfaceVisibilityEventData | null {
    return this.#visibilityEvent;
  }
  setVisibilityEvent(event: ALSurfaceVisibilityEventData): ALSurfaceVisibilityEventData {
    return this.#visibilityEvent = event;
  }

  remove(): boolean {
    /**
     * While mount event happens bottom-up, the unmount event (may) happens top down.
     * We can remove the parent node once all its children are removed. Also, since the
     * application might have associated surface data, we would want to keep those surfaces
     * around. So, as soon as we reach a leaf node that has data, we should stop. 
     */

    console.log(`Removing surface: ${this.surface}`);

    // If this method is called explicitly, we are done with the surface and can remove it, so first cleanup state
    this.#mutationEvent = null;
    this.#visibilityEvent = null;

    const isChildless = this.children.length === 0
    if (!isChildless || this.#locked) {
      // We cannot yet remove the node itself
      return false;
    }

    if (this.parent) {
      const parentsChildren = this.parent.children;
      // Remove this from parent's children

      // The following is a fast remove
      const index = parentsChildren.indexOf(this);
      if (index > -1) {
        parentsChildren[index] = parentsChildren[parentsChildren.length - 1]; // move the last one to the found location
        parentsChildren.length -= 1;
        const canPropageUpwardRemove = parentsChildren.length === 0 && this.parent.#mutationEvent === null && this.parent.#visibilityEvent === null;
        if (canPropageUpwardRemove) {
          this.parent.remove();
        }
      } else {
        __DEV__ && assert(index > -1, `Invalid situation! surface ${this.surface} should be child of ${this.parent.surface}`);
      }
    }

    surfacesData.delete(this.surface);
    return true;
  }

  getInheritedPropery<T>(propName: string): T | undefined | null {
    return this.__ext[propName] as T;
  }

  setInheritedPropery<T>(propName: string, propValue: T): T {
    this.__ext[propName] = propValue;

    this.#locked = true; // now that this node has data, it should never be removed

    return propValue;
  }

}
