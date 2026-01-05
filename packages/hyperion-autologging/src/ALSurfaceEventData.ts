/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { Channel } from "hyperion-channel";
import { SafeGetterSetter } from "hyperion-util/src/SafeGetterSetter";
import { ALSurfaceData } from "./ALSurfaceData";
import { ALSurfaceCapability } from "./ALSurfaceTypes";
import { ALFlowletEvent, ALMetadataEvent } from "./ALType";

export type ALSurfaceEvent = Readonly<{
  surface: string;
  surfaceData: ALSurfaceData;
}>;


export type ALSurfaceEventData =
  ALMetadataEvent &
  ALFlowletEvent &
  ALSurfaceEvent &
  Readonly<{
    element: Element;
    isProxy: boolean;
    capability: ALSurfaceCapability | null | undefined;
  }>;

export type ALChannelSurfaceEvent = Readonly<{
  al_surface_render: [Omit<ALSurfaceEventData, "element">];
  al_surface_mount: [ALSurfaceEventData];
  al_surface_unmount: [ALSurfaceEventData];
}>;


export const ALSurfaceChannel = new SafeGetterSetter<Channel<ALChannelSurfaceEvent>>();
