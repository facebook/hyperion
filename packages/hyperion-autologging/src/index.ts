/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import * as Types from "@hyperion/hyperion-util/src/Types";
import * as ALSurface from "./ALSurface";

export type InitOptions = Types.Options<{
  surface: ALSurface.InitOptions;
}>;

export function init(options: InitOptions): ALSurface.ALSurfaceHOC {
  return ALSurface.init(options.surface);
}