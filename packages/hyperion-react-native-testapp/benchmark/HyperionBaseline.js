/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */

'use strict';

import React from 'react';

export const AutoLogging = {
  init() {},
};

export function createAutoLoggingChannel() {
  return {
    addListener() {
      return { remove() {} };
    },
  };
}

function plugin(name) {
  return { name };
}

export const reactNativeSurfaces = () => plugin('surfaces');
export const reactNativeUIEvents = () => plugin('ui');
export const reactNativeAppLifecycle = () => plugin('lifecycle');
export const reactNativeHeartbeat = () => plugin('heartbeat');
export const reactNativeAppStateEvents = () => plugin('app-state');
export const reactNativeScreens = () => plugin('screens');
export const reactNativeListImpressions = () => plugin('lists');
export const reactNativeDeepLinks = () => plugin('deep-links');
export const reactNativeReactErrors = () => plugin('react-errors');

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

export function createTransportEnvelope(family, event, appName) {
  return {
    family,
    event,
    context: {
      appName,
      appSessionId: 'baseline',
      sessionId: 'baseline',
      appInstanceId: 'baseline',
      screenId: 'baseline',
      screen: 'fixture_home',
    },
  };
}
