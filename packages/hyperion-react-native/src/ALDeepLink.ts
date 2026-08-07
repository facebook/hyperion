/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getALRuntimeChannel } from './ALChannel';
import { isALFeatureEnabled } from './ALRuntime';
import type { ALDeepLinkSource, SurfaceMetadata } from './ALTypes';

export interface ALDeepLinkOptions {
  source: ALDeepLinkSource;
  metadata?: SurfaceMetadata;
}

export function logDeepLinkOpen(
  targetURI: string,
  options: ALDeepLinkOptions
): boolean {
  if (!isALFeatureEnabled('deepLinkEvents')) return false;
  if (targetURI.length === 0 || !isDeepLinkSource(options.source)) return false;
  const channel = getALRuntimeChannel();
  if (channel == null) return false;
  try {
    channel.emitSafely('al_deep_link_request', {
      timestamp: Date.now(),
      targetURI,
      source: options.source,
      metadata: options.metadata,
    });
  } catch {
    return false;
  }
  return true;
}

function isDeepLinkSource(value: unknown): value is ALDeepLinkSource {
  return (
    value === 'initial_url' || value === 'url_event' || value === 'notification'
  );
}
