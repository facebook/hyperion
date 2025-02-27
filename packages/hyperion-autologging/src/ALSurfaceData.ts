/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "hyperion-globals/src/assert";
import type { ALSurfaceMutationEventData } from "./ALSurfaceMutationPublisher";
import type { ALSurfaceVisibilityEventData } from "./ALSurfaceVisibilityPublisher";
import { type IALFlowlet } from "./ALFlowletManager";
import type { ALSurfaceCapability } from "./ALSurface";
import { type Metadata } from "./ALType";

export type ALSurfaceEvent = Readonly<{
  surface: string;
  surfaceData: ALSurfaceData;
}>;

type WritableEventMetadata = {
  [eventName in keyof DocumentEventMap]?: Metadata
};
export type EventMetadata = Readonly<WritableEventMetadata>;

/**
 * This core class captures the general structure of the tree.
 * The sub-classes who extend it may further specialize the types.
 * Note that we only allow the ALSurfaceData objects to be added
 * as children, effectively separating the root node from the rest
 * of tree nodes.
 */
abstract class ALSurfaceDataCore {
  private __ext: { [namespace: string]: any; };
  #locked: boolean = false; // allow removal by default

  readonly children: ALSurfaceData[] = [];
  readonly elements: Set<Element> = new Set<Element>();

  constructor(
    public readonly surface: string | null,
    public readonly parent: ALSurfaceDataCore | null,
  ) {
    this.__ext = Object.create(this.parent?.__ext ?? null);
  }

  public isRemovable(): boolean {
    const isChildless = this.children.length === 0
    return isChildless && !this.#locked;
  }
  remove(): boolean {
    return this.isRemovable();
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
/**
 * We need at least one root node when no Surface is yet created.
 * This singleton surface helps us manage the tree easier and also
 * can provide a default value for the surface context later.
 */
class ALSurfaceDataRoot extends ALSurfaceDataCore {
  static singlton = new ALSurfaceDataRoot();
  public readonly surface: null = null;
  public readonly parent: null = null;
  public readonly nonInteractiveSurface: null = null;
  public readonly callFlowlet: null = null;
  public readonly capability: null = null;
  public readonly domAttributeName: null = null;
  public readonly domAttributeValue: null = null;

  private constructor() {
    super(null, null);
    assert(!ALSurfaceDataRoot.singlton, `There should be only one instance of root ALSurfaceData`);
  }

  public isRemovable(): boolean {
    return false;
  }
}

const InheritedEventMetadataProperyName = "__uiEventMetadata";

const surfacesData = new Map<string, ALSurfaceData>();
export class ALSurfaceData extends ALSurfaceDataCore {
  static root = ALSurfaceDataRoot.singlton;

  static tryGet(surface: string): ALSurfaceData | null | undefined {
    return surfacesData.get(surface);
  }
  static get(surface: string): ALSurfaceData {
    let data = surfacesData.get(surface);
    assert(data != null, `Invalid situation! Surface ${surface} does not exits!`);
    // if (!data) {
    //   const parentNameLength = surface.lastIndexOf(SURFACE_SEPARATOR);
    //   let parentData: ALSurfaceData = ALSurfaceData.root;
    //   if (parentNameLength > 0) {
    //     let parentSurfaceName = surface.substring(0, parentNameLength);
    //     parentData = ALSurfaceData.get(parentSurfaceName);
    //   }
    //   data = new ALSurfaceData(surface, parentData);
    //   parentData.children.push(data);
    //   surfacesData.set(surface, data);
    // }
    return data;
  }

  #mutationEvent: ALSurfaceMutationEventData | null = null;
  #visibilityEvent: ALSurfaceVisibilityEventData | null = null;

  constructor(
    public readonly surface: string,
    public readonly parent: ALSurfaceData | ALSurfaceDataRoot,
    public readonly nonInteractiveSurface: string,
    public readonly callFlowlet: IALFlowlet,
    public readonly capability: ALSurfaceCapability | null | undefined,
    public metadata: Metadata,
    uiEventMetadata: EventMetadata | null | undefined,
    public readonly domAttributeName: string,
    public readonly domAttributeValue: string,
  ) {
    super(surface, parent);
    this.parent.children.push(this);

    /**
     * Every surface gets a unique nonInteractiveSurface name that
     * is full path from all surfaces from the root.
     * However, the nonInteractive surfaces, get the parent interactive
     * surface name as their `this.surface`.
     * To make sure all of these are searchable, we always add surface
     * to the map with the unique nonInteractiveSurface key, and for
     * interactive ones, also add based on surface key
     */
    if (__DEV__) {
      assert(
        !surfacesData.get(nonInteractiveSurface),
        `Surface ${surface} is already added to list`
      );
      assert(
        this.parent.surface === null || surfacesData.has(this.parent.nonInteractiveSurface),
        `Parent of surface ${surface} does not exist in the list`
      );
    }
    if (!capability?.nonInteractive) {
      surfacesData.set(surface, this);
    }
    surfacesData.set(nonInteractiveSurface, this);

    /**
     * We need to setup eventMetadata in a way that values from parent surfaces merge down with lower surfaces.
     * To minimize the object creation, we use the getInheritedPropery mechanism to directly get the values
     * from the surface node that does have eventMetadata
     */
    if (uiEventMetadata) {
      const parentEventMetadata = this.getInheritedPropery<EventMetadata>(InheritedEventMetadataProperyName);
      let fullEventMetadata: WritableEventMetadata;
      if (parentEventMetadata) {
        fullEventMetadata = Object.create(parentEventMetadata); // We automatically inherit values from parent object
        (Object.keys(uiEventMetadata) as Array<keyof DocumentEventMap>).forEach(eventName => {
          fullEventMetadata[eventName] = { ...parentEventMetadata[eventName], ...uiEventMetadata[eventName] };
        });
      } else {
        fullEventMetadata = uiEventMetadata;
      }
      this.setInheritedPropery(InheritedEventMetadataProperyName, fullEventMetadata);
    }
  }

  getInheriteUIEventMetadata(uiEventName: keyof DocumentEventMap): Metadata | undefined {
    return this.getInheritedPropery<EventMetadata>(InheritedEventMetadataProperyName)?.[uiEventName];
  }

  getMutationEvent(): ALSurfaceMutationEventData | null {
    return this.#mutationEvent;
  }
  setMutationEvent<T extends ALSurfaceMutationEventData | null>(event: T): T {
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
  setVisibilityEvent<T extends ALSurfaceVisibilityEventData | null>(event: T): T {
    // return this.#visibilityEvent = event; // For now not keeping the event to see the impact on memory
    return event;
  }

  public isRemovable(): boolean {
    return super.isRemovable() && this.#mutationEvent === null && this.#visibilityEvent === null;
  }

  remove(): boolean {
    /**
     * While mount event happens bottom-up, the unmount event (may) happen top down.
     * We can remove the parent node once all its children are removed. Also, since the
     * application might have associated surface data, we would want to keep those surfaces
     * around. So, as soon as we reach a leaf node that has data, we should stop. 
     */
    if (!this.isRemovable()) {
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
        const canPropageUpwardRemove = this.parent.isRemovable();
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


}
