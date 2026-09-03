/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React from 'react';

export const AutoLogging = {
  init() {},
};

const root = {
  surface: null,
  getChildren: () => [],
  setInheritedPropery: (_name, value) => value,
};

export const ALSurfaceData = {
  root,
  get: () => undefined,
  tryGet: () => undefined,
};

export function ALSurface({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export function setCurrentScreen() {
  return true;
}

export function getCurrentScreen() {
  return { name: 'fixture_home', screenId: 'baseline' };
}

export function logDeepLinkOpen() {
  return true;
}

export function logReactErrorBoundary() {
  return true;
}

export function useALListViewability(options) {
  return {
    onViewableItemsChanged: (info) => options.onViewableItemsChanged?.(info),
    viewabilityConfig: options.viewabilityConfig ?? {
      minimumViewTime: 500,
      itemVisiblePercentThreshold: 50,
    },
  };
}
