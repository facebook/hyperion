/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getALRuntimeChannel } from './ALChannel';
import { isALRuntimeEnabled } from './ALRuntime';

export interface ALReactErrorInfo {
  componentStack?: string | null;
}

export interface ALReactErrorOptions {
  boundaryName?: string;
  errorCategory?: string;
}

export function logReactErrorBoundary(
  error: unknown,
  info: ALReactErrorInfo,
  options: ALReactErrorOptions = {}
): boolean {
  if (!isALRuntimeEnabled()) return false;
  try {
    const channel = getALRuntimeChannel();
    if (channel == null) return false;
    const errorObject =
      typeof error === 'object' && error != null
        ? (error as { message?: unknown; name?: unknown; stack?: unknown })
        : null;
    const errorName =
      typeof errorObject?.name === 'string' ? errorObject.name : 'Error';
    const errorMessage =
      typeof errorObject?.message === 'string'
        ? errorObject.message
        : undefined;
    const errorStack =
      typeof errorObject?.stack === 'string' ? errorObject.stack : undefined;
    channel.emitSafely('al_react_error_request', {
      timestamp: Date.now(),
      errorName,
      errorMessage,
      errorStack,
      boundaryName: options.boundaryName,
      errorCategory: options.errorCategory,
      reactComponentStack: info.componentStack ?? undefined,
    });
  } catch {
    return false;
  }
  return true;
}
