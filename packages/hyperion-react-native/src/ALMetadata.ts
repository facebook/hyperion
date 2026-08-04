/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { SurfaceMetadataValue } from './ALTypes';

export function mergeMetadata(
  ...sources: readonly (Readonly<Record<string, unknown>> | null | undefined)[]
): Record<string, SurfaceMetadataValue> {
  const result: Record<string, SurfaceMetadataValue> = {};
  for (const source of sources) {
    if (source == null) continue;
    for (const [key, value] of Object.entries(source)) {
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        typeof value === 'number'
      ) {
        result[key] = value;
      }
    }
  }
  return result;
}

export function getExplicitText(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
