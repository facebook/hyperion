/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import type { ALReactNativeRuntimeContext } from './ALRuntime';

let activeContext: ALReactNativeRuntimeContext | null = null;

export function setActiveRuntimeContext(
  context: ALReactNativeRuntimeContext
): void {
  activeContext = context;
}

export function clearActiveRuntimeContext(
  context: ALReactNativeRuntimeContext
): void {
  if (activeContext === context) activeContext = null;
}

export function getActiveRuntimeContext(): ALReactNativeRuntimeContext | null {
  return activeContext;
}
