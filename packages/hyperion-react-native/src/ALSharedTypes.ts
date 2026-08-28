/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

export type SurfaceMetadataValue = string | number | boolean | null;
export type SurfaceMetadata = Readonly<Record<string, SurfaceMetadataValue>>;
export type UIEventMetadata = Readonly<Record<string, SurfaceMetadata>>;
