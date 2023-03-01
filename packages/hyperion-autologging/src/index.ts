/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALSurface from "./ALSurface";
import * as ALUIeventPublisher from "./ALUIEventPublisher";
import * as ALHeartbeat from "./ALHeartbeat";

export type InitOptions = Types.Options<{
  surface: ALSurface.InitOptions;
  uiEventPublisher?: ALUIeventPublisher.InitOptions;
  heartbeat?: ALHeartbeat.InitOptions;
}>;

export function init(options: InitOptions): ALSurface.ALSurfaceHOC {
  if (options.uiEventPublisher) {
    ALUIeventPublisher.publish(options.uiEventPublisher);
  }

  if (options.heartbeat) {
    ALHeartbeat.start(options.heartbeat);
  }

  return ALSurface.init(options.surface);
}