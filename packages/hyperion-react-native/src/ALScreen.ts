/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import { getALRuntimeChannel } from './ALChannel';
import { getExplicitText } from './ALMetadata';
import { getScreenId, rotateScreenId } from './ALSession';
import type { SurfaceMetadata } from './ALTypes';

export interface ALScreenState {
  name: string;
  screenId: string;
}

let currentScreen: ALScreenState | null = null;

export function getCurrentScreen(): ALScreenState | null {
  return currentScreen;
}

export function setCurrentScreen(
  name: string,
  metadata?: SurfaceMetadata
): boolean {
  const explicitName = getExplicitText(name);
  if (explicitName == null || currentScreen?.name === explicitName) {
    return false;
  }
  const previousScreen = currentScreen;
  rotateScreenId();
  currentScreen = { name: explicitName, screenId: getScreenId() };
  getALRuntimeChannel()?.emitSafely('al_screen_transition_request', {
    timestamp: Date.now(),
    screen: currentScreen.name,
    screenId: currentScreen.screenId,
    previousScreen: previousScreen?.name,
    previousScreenId: previousScreen?.screenId,
    metadata,
  });
  return true;
}

export function resetALScreenForTests(): void {
  currentScreen = null;
}
