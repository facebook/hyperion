/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { assert } from "@hyperion/global";
import { Channel } from "@hyperion/hook/src/Channel";
import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALHeartbeat from "./ALHeartbeat";
import * as ALSurface from "./ALSurface";
import * as ALSurfaceMutationPublisher from "./ALSurfaceMutationPublisher";
import * as ALUIeventPublisher from "./ALUIEventPublisher";

/**
 * This type extracts the union of all events types so that external modules
 * don't have to import these types one by one.
 */
export type ALChannelEvent = (
  ALSurface.InitOptions['channel'] &
  ALUIeventPublisher.InitOptions['channel'] &
  ALHeartbeat.InitOptions['channel'] &
  ALSurfaceMutationPublisher.InitOptions['channel']
) extends Channel<infer EventType> ? EventType : never;

export type InitOptions = Types.Options<{
  surface: ALSurface.InitOptions;
  uiEventPublisher?: ALUIeventPublisher.InitOptions;
  heartbeat?: ALHeartbeat.InitOptions;
  surfaceMutationPublisher?: ALSurfaceMutationPublisher.InitOptions;
}>;

export type InitResults = Readonly<{
  surfaceRenderer: ALSurface.ALSurfaceHOC;
}>;

let cachedResults: InitResults | null = null;

export function init(options: InitOptions): InitResults {
  if (cachedResults !== null) {
    return cachedResults;
  }

  if (options.uiEventPublisher) {
    ALUIeventPublisher.publish(options.uiEventPublisher);
  }

  if (options.heartbeat) {
    ALHeartbeat.start(options.heartbeat);
  }

  if (options.surfaceMutationPublisher) {
    ALSurfaceMutationPublisher.publish(options.surfaceMutationPublisher);
  }

  cachedResults = {
    surfaceRenderer: ALSurface.init(options.surface),
  };

  return cachedResults;
}

export function getSurfaceRenderer(defaultALSurfaceHOC?: ALSurface.ALSurfaceHOC): ALSurface.ALSurfaceHOC {
  const renderer = cachedResults?.surfaceRenderer ?? defaultALSurfaceHOC;
  assert(
    renderer != null,
    "AutoLogging must have been initilized first. Did you forget to call .init() functions?",
    {
      logger: {
        error: msg => {
          console.error(msg);
          throw msg;
        }
      }
    }
  );
  return renderer;
}
